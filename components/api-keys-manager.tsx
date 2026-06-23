'use client'

import { useState, useEffect } from 'react'
import { Copy, Trash2, Eye, EyeOff, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  app_name: string
  key_preview?: string
  scope: string[]
  rate_limit: number
  created_at: string
  expires_at: string
  is_active: boolean
  is_test: boolean
  last_used_at?: string
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    appName: '',
    rateLimit: 100,
    expiresInDays: 365,
    isTest: false
  })
  const [createdKey, setCreatedKey] = useState<any>(null)
  const [showCreatedKey, setShowCreatedKey] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/keys')
      if (!response.ok) throw new Error('Failed to fetch keys')
      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error) {
      toast.error('Failed to load API keys')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateKey() {
    if (!newKeyData.appName.trim()) {
      toast.error('App name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: newKeyData.appName,
          scope: ['users:read', 'trades:read', 'market:read', 'analytics:read'],
          rateLimit: newKeyData.rateLimit,
          expiresInDays: newKeyData.expiresInDays,
          isTest: newKeyData.isTest
        })
      })

      if (!response.ok) throw new Error('Failed to create key')
      const data = await response.json()

      setCreatedKey(data)
      setShowCreatedKey(true)
      setShowNewKeyDialog(false)
      setNewKeyData({ appName: '', rateLimit: 100, expiresInDays: 365, isTest: false })
      
      toast.success('API key created successfully')
      fetchKeys()
    } catch (error) {
      toast.error('Failed to create API key')
      console.error(error)
    }
  }

  async function handleDeleteKey(keyId: string) {
    try {
      const response = await fetch(`/api/admin/keys/${keyId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete key')
      
      toast.success('API key revoked')
      fetchKeys()
    } catch (error) {
      toast.error('Failed to revoke API key')
      console.error(error)
    }
  }

  async function handleToggleActive(keyId: string, currentState: boolean) {
    try {
      const response = await fetch(`/api/admin/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentState })
      })

      if (!response.ok) throw new Error('Failed to update key')
      toast.success(`API key ${!currentState ? 'activated' : 'deactivated'}`)
      fetchKeys()
    } catch (error) {
      toast.error('Failed to update API key')
      console.error(error)
    }
  }

  function copyToClipboard(text: string, keyId: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(keyId)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-sm text-gray-600 mt-1">Manage API keys for external integrations</p>
        </div>
        <Button onClick={() => setShowNewKeyDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Key
        </Button>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>Generate a new API key for external platform integration</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Application Name</label>
              <Input
                value={newKeyData.appName}
                onChange={(e) => setNewKeyData({ ...newKeyData, appName: e.target.value })}
                placeholder="e.g., Trading Bot, Analytics Dashboard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rate Limit (req/min)</label>
              <Input
                type="number"
                value={newKeyData.rateLimit}
                onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) })}
                min={10}
                max={10000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiration (days)</label>
              <Input
                type="number"
                value={newKeyData.expiresInDays}
                onChange={(e) => setNewKeyData({ ...newKeyData, expiresInDays: parseInt(e.target.value) })}
                min={1}
                max={3650}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newKeyData.isTest}
                onChange={(e) => setNewKeyData({ ...newKeyData, isTest: e.target.checked })}
                id="isTest"
                className="rounded"
              />
              <label htmlFor="isTest" className="text-sm">Test Key (sk_test_*)</label>
            </div>
            <Button onClick={handleCreateKey} className="w-full">Create API Key</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Created Key Dialog */}
      <Dialog open={showCreatedKey} onOpenChange={setShowCreatedKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>Save your API key now. You won&apos;t be able to see it again.</DialogDescription>
          </DialogHeader>
          {createdKey && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                ⚠️ Store this key securely. It won&apos;t be displayed again.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                    {createdKey.key}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdKey.key, 'new')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">App Name</p>
                  <p className="font-medium">{createdKey.appName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rate Limit</p>
                  <p className="font-medium">{createdKey.rateLimit} req/min</p>
                </div>
                <div>
                  <p className="text-gray-600">Expires</p>
                  <p className="font-medium">{new Date(createdKey.expiresAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium">{createdKey.isTest ? 'Test' : 'Production'}</p>
                </div>
              </div>
              <Button onClick={() => setShowCreatedKey(false)} className="w-full">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>Manage and monitor API key usage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Loading API keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{key.app_name}</h3>
                      {key.is_test && <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Test</span>}
                      {!key.is_active && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">Inactive</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Limit: {key.rate_limit}/min • Expires: {new Date(key.expires_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Scope: {key.scope.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(key.id, key.is_active)}
                      title={key.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {key.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will immediately revoke the API key &quot;{key.app_name}&quot;. Any applications using this key will stop working.
                        </AlertDialogDescription>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteKey(key.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Revoke
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            📚 <strong>Need help?</strong> Check out the{' '}
            <a href="/API_DOCUMENTATION.md" className="underline font-medium">API Documentation</a> or{' '}
            <a href="/API_QUICK_START.md" className="underline font-medium">Quick Start Guide</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
