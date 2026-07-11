// Deriv API Integration for Real Trading

export interface DerivTradeConfig {
  symbol: string
  prediction: 'UP' | 'DOWN' | 'OVER' | 'UNDER' | 'EVEN' | 'ODD' | 'MATCHES' | 'DIFFERS' | 'RISE' | 'FALL'
  stake: number
  ticks: number
  contractType: string
}

export interface DerivTradeResult {
  contractId: string
  status: 'open' | 'closed'
  stake: number
  payout: number
  profit: number
  win: boolean
  entrySpot: number
  exitSpot: number
  entryTime: number
  exitTime: number
}

export class DerivTradingService {
  private wsConnection: WebSocket | null = null
  private requestId: number = 1
  private callbacks: Map<number, (response: any) => void> = new Map()

  constructor(private apiUrl: string = 'wss://ws.derivws.com/websockets/v3') {}

  /**
   * Connect to Deriv WebSocket API
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.wsConnection = new WebSocket(this.apiUrl)

        this.wsConnection.onopen = () => {
          console.log('[v0] Deriv WebSocket connected')
          resolve(true)
        }

        this.wsConnection.onmessage = (event) => {
          const response = JSON.parse(event.data)
          const reqId = response.req_id

          if (reqId && this.callbacks.has(reqId)) {
            const callback = this.callbacks.get(reqId)
            callback?.(response)
            this.callbacks.delete(reqId)
          }
        }

        this.wsConnection.onerror = (error) => {
          console.error('[v0] WebSocket error:', error)
          resolve(false)
        }

        this.wsConnection.onclose = () => {
          console.log('[v0] WebSocket disconnected')
        }

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.wsConnection?.readyState !== WebSocket.OPEN) {
            resolve(false)
          }
        }, 5000)
      } catch (error) {
        console.error('[v0] Connection error:', error)
        resolve(false)
      }
    })
  }

  /**
   * Send request to Deriv API
   */
  private async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const reqId = this.requestId++
      request.req_id = reqId

      this.callbacks.set(reqId, (response) => {
        if (response.error) {
          reject(new Error(response.error.message))
        } else {
          resolve(response)
        }
      })

      try {
        this.wsConnection.send(JSON.stringify(request))

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.callbacks.has(reqId)) {
            this.callbacks.delete(reqId)
            reject(new Error('Request timeout'))
          }
        }, 10000)
      } catch (error) {
        this.callbacks.delete(reqId)
        reject(error)
      }
    })
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    try {
      const response = await this.sendRequest({
        balance: 1,
      })
      return response.balance?.balance || 0
    } catch (error) {
      console.error('[v0] Balance fetch error:', error)
      return 0
    }
  }

  /**
   * Execute a trade
   */
  async executeTrade(config: DerivTradeConfig): Promise<DerivTradeResult | null> {
    try {
      // Map our prediction format to Deriv contract types
      const contractType = this.mapPredictionToContractType(config.prediction)

      const response = await this.sendRequest({
        buy: 1,
        subscribe: 1,
        contract_type: contractType,
        currency: 'USD',
        amount: config.stake,
        symbol: config.symbol,
        duration: config.ticks,
        duration_unit: 't', // ticks
      })

      if (response.buy) {
        const contractId = response.buy.contract_id

        // Listen for contract close
        return await this.waitForContractClose(contractId, config.stake)
      }

      return null
    } catch (error) {
      console.error('[v0] Trade execution error:', error)
      return null
    }
  }

  /**
   * Wait for contract to close and return result
   */
  private async waitForContractClose(
    contractId: string,
    stake: number
  ): Promise<DerivTradeResult> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          contractId,
          status: 'open',
          stake,
          payout: 0,
          profit: 0,
          win: false,
          entrySpot: 0,
          exitSpot: 0,
          entryTime: 0,
          exitTime: 0,
        })
      }, 120000) // 2 minute timeout

      const checkInterval = setInterval(async () => {
        try {
          const response = await this.sendRequest({
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 1,
          })

          if (response.proposal_open_contract) {
            const contract = response.proposal_open_contract
            if (contract.status === 'closed') {
              clearInterval(checkInterval)
              clearTimeout(timeout)

              const profit = (contract.payout || 0) - stake
              resolve({
                contractId,
                status: 'closed',
                stake,
                payout: contract.payout || 0,
                profit,
                win: profit > 0,
                entrySpot: contract.entry_spot || 0,
                exitSpot: contract.exit_spot || 0,
                entryTime: contract.entry_tick_time || 0,
                exitTime: contract.exit_tick_time || 0,
              })
            }
          }
        } catch (error) {
          console.error('[v0] Contract check error:', error)
        }
      }, 1000) // Check every second
    })
  }

  /**
   * Map prediction to Deriv contract type
   */
  private mapPredictionToContractType(prediction: string): string {
    const mapping: { [key: string]: string } = {
      RISE: 'CALL',
      FALL: 'PUT',
      OVER: 'HIGHER',
      UNDER: 'LOWER',
      EVEN: 'EVEN',
      ODD: 'ODD',
      MATCHES: 'MATCHES',
      DIFFERS: 'DIFFERS',
      UP: 'CALL',
      DOWN: 'PUT',
    }
    return mapping[prediction] || 'CALL'
  }

  /**
   * Get live ticks
   */
  async subscribeToTicks(symbol: string, callback: (tick: number) => void): Promise<void> {
    try {
      const response = await this.sendRequest({
        ticks: symbol,
        subscribe: 1,
      })

      if (this.wsConnection) {
        this.wsConnection.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.tick) {
            callback(data.tick.quote)
          }
        }
      }
    } catch (error) {
      console.error('[v0] Tick subscription error:', error)
    }
  }

  /**
   * Disconnect from API
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
    }
  }
}
