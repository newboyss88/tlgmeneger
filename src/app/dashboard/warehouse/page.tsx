'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Warehouse, Plus, Package, ArrowUpCircle, ArrowDownCircle,
  Search, Edit2, Trash2, X, Save, AlertTriangle, Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Product {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
  unit: string
  minQuantity: number
}

interface WarehouseItem {
  id: string
  name: string
  description: string
  location: string
  products: Product[]
}

export default function WarehousePage() {
  const { t } = useLanguage()
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null)
  
  const [showAddWarehouse, setShowAddWarehouse] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showTransaction, setShowTransaction] = useState<{ productId: string, type: 'IN' | 'OUT' } | null>(null)
  
  const [newWarehouse, setNewWarehouse] = useState({ name: '', description: '', location: '' })
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', quantity: 0, price: 0, unit: 'dona', minQuantity: 0 })
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [transactionQty, setTransactionQty] = useState(1)
  const [transactionNote, setTransactionNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [bots, setBots] = useState<any[]>([])

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'warehouse' | 'product'
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouse')
      if (res.ok) {
        const data = await res.json()
        setWarehouses(data)
        if (data.length > 0 && !selectedWarehouse) {
          setSelectedWarehouse(data[0].id)
        }
      }
    } catch (error) {
      toast.error(t('load_users_error'))
    } finally {
      setLoading(false)
    }
  }

  const fetchBots = async () => {
    try {
      const res = await fetch('/api/bot')
      if (res.ok) setBots(await res.json())
    } catch {}
  }

  useEffect(() => {
    fetchWarehouses()
    fetchBots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentWarehouse = warehouses.find(w => w.id === selectedWarehouse)

  const filteredProducts = currentWarehouse?.products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const handleSaveWarehouse = async () => {
    if (!newWarehouse.name) return toast.error(t('wh_name_required'))
    
    // Validate botId
    if (!editingWarehouse && !(newWarehouse as any).botId) {
      if (bots.length === 0) return toast.error(t('bot_connection_required'))
      // Agar tanlanmagan bo'lsa va 1 ta bot bo'lsa o'shani olamiz
      if (bots.length === 1) (newWarehouse as any).botId = bots[0].id
      else return toast.error(t('select_bot_error'))
    }

    setIsSubmitting(true)
    try {
      if (editingWarehouse) {
        const res = await fetch(`/api/warehouse/${editingWarehouse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWarehouse)
        })
        if (res.ok) {
          setShowAddWarehouse(false)
          setEditingWarehouse(null)
          toast.success(t('wh_updated'))
          await fetchWarehouses()
        } else {
          toast.error(t('edit_error'))
        }
      } else {
        const res = await fetch('/api/warehouse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWarehouse)
        })
        if (res.ok) {
          const wh = await res.json()
          setWarehouses([wh, ...warehouses])
          setSelectedWarehouse(wh.id)
          setNewWarehouse({ name: '', description: '', location: '' })
          setShowAddWarehouse(false)
          toast.success(t('wh_created'))
          await fetchWarehouses()
        } else {
          const data = await res.json()
          toast.error(data.error || t('edit_error'))
        }
      }
    } catch (error) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWarehouse = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const wh = warehouses.find(w => w.id === id)
    setDeleteConfirm({ type: 'warehouse', id, name: wh?.name || 'Sklad' })
  }

  const handleSaveProduct = async () => {
    if (!newProduct.name || !selectedWarehouse) return toast.error(t('product_name_required'))
    setIsSubmitting(true)
    try {
      if (editingProduct) {
        const res = await fetch(`/api/product/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        })
        if (res.ok) {
          toast.success(t('product_updated'))
          await fetchWarehouses()
          setEditingProduct(null)
          setShowAddProduct(false)
        } else {
          toast.error(t('edit_error'))
        }
      } else {
        const res = await fetch('/api/product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newProduct, warehouseId: selectedWarehouse })
        })
        if (res.ok) {
          toast.success(t('product_created'))
          await fetchWarehouses()
          setNewProduct({ name: '', sku: '', quantity: 0, price: 0, unit: 'dona', minQuantity: 0 })
          setShowAddProduct(false)
        } else {
          toast.error(t('edit_error'))
        }
      }
    } catch (error) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    const product = currentWarehouse?.products.find(p => p.id === id)
    setDeleteConfirm({ type: 'product', id, name: product?.name || 'Mahsulot' })
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      const url = deleteConfirm.type === 'warehouse'
        ? `/api/warehouse/${deleteConfirm.id}`
        : `/api/product/${deleteConfirm.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        toast.success(deleteConfirm.type === 'warehouse' ? t('wh_deleted') : t('product_deleted'))
        if (deleteConfirm.type === 'warehouse' && selectedWarehouse === deleteConfirm.id) {
          setSelectedWarehouse(null)
        }
        fetchWarehouses()
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('DELETE xatosi:', res.status, errData)
        toast.error(errData.error || t('delete_error'))
      }
    } catch (err) {
      console.error('DELETE network xatosi:', err)
      toast.error(t('network_error'))
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const handleTransaction = async () => {
    if (!showTransaction || !selectedWarehouse) return
    if (transactionQty <= 0) return toast.error(t('qty_positive_error'))
    
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/product/${showTransaction.productId}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: showTransaction.type, quantity: transactionQty, note: transactionNote })
      })
      
      if (res.ok) {
        toast.success(showTransaction.type === 'IN' ? t('income_success') : t('outcome_success'))
        await fetchWarehouses()
        setShowTransaction(null)
        setTransactionQty(1)
        setTransactionNote('')
      } else {
        const d = await res.json()
        toast.error(d.error || t('edit_error'))
      }
    } catch (error) {
      toast.error(t('server_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => new Intl.NumberFormat(t('language') === 'en' ? 'en-US' : (t('language') === 'ru' ? 'ru-RU' : 'uz-UZ')).format(price) + ' ' + (t('language') === 'en' ? 'sum' : 'so\'m')

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin" size={32} color="var(--primary-400)" />
    </div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{t('wh_page_title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('wh_page_desc')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditingWarehouse(null)
          setNewWarehouse({ name: '', description: '', location: '', botId: '' } as any)
          setShowAddWarehouse(true)
        }}>
          <Plus size={18} /> {t('new_wh')}
        </button>
      </div>

      {/* Warehouse Cards */}
      {warehouses.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <Warehouse size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{t('no_warehouse')}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{t('connect_bot_create_wh')}</p>
          <button className="btn btn-primary" onClick={() => setShowAddWarehouse(true)} style={{ margin: '0 auto' }}>
            {t('create_new_wh')}
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px',
        }}>
          {warehouses.map((wh: any, i) => (
            <motion.div
              key={wh.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card" onClick={() => setSelectedWarehouse(wh.id)}
              style={{
                cursor: 'pointer',
                border: selectedWarehouse === wh.id ? '1px solid var(--primary-500)' : undefined,
                boxShadow: selectedWarehouse === wh.id ? 'var(--shadow-glow)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Warehouse size={22} color="var(--success)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{wh.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--primary-400)' }}>
                      {wh.bot ? `@${wh.bot.username}` : wh.location || t('location_not_found')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-icon btn-sm" onClick={(e) => {
                    e.stopPropagation()
                    setEditingWarehouse(wh)
                    setNewWarehouse({ name: wh.name, description: wh.description || '', location: wh.location || '', botId: wh.botId } as any)
                    setShowAddWarehouse(true)
                  }} style={{ color: 'var(--text-secondary)' }} title={t('edit')}><Edit2 size={16} /></button>
                  <button className="btn btn-icon btn-sm" onClick={(e) => handleDeleteWarehouse(e, wh.id)} style={{ color: 'var(--error)' }} title={t('delete')}><Trash2 size={16} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-400)' }}>{wh.products?.length || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('product')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-emerald)' }}>
                    {wh.products?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{t('total_units')}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Products Table */}
      {currentWarehouse && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} /> {currentWarehouse.name} — {t('wh_products_header')}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  type="text" className="input" placeholder={t('search')}
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', width: '200px', height: '38px', fontSize: '13px' }}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setEditingProduct(null)
                setNewProduct({ name: '', sku: '', quantity: 0, price: 0, unit: 'dona', minQuantity: 0 })
                setShowAddProduct(true)
              }}>
                <Plus size={16} /> {t('new_product')}
              </button>
            </div>
          </div>

          {currentWarehouse.products && currentWarehouse.products.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('product')}</th>
                    <th>{t('sku')}</th>
                    <th>{t('quantity')}</th>
                    <th>{t('price')}</th>
                    <th>{t('unit')}</th>
                    <th>{t('status')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: '600' }}>{product.name}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)', fontSize: '13px' }}>{product.sku || '-'}</td>
                      <td>
                        <span style={{ fontWeight: '700', color: product.quantity <= product.minQuantity ? 'var(--error)' : 'var(--text-primary)' }}>
                          {product.quantity}
                        </span>
                      </td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: '500', fontSize: '13px' }}>{formatPrice(product.price)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{product.unit}</td>
                      <td>
                        {product.quantity <= product.minQuantity ? (
                          <span className="badge badge-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> {t('status_low')}
                          </span>
                        ) : (
                          <span className="badge badge-success">{t('status_ok')}</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn btn-icon btn-sm" onClick={() => setShowTransaction({ productId: product.id, type: 'IN' })}
                            style={{ width: '30px', height: '30px', color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }} title={t('income_title')}
                          ><ArrowUpCircle size={14} /></button>
                          <button
                            className="btn btn-icon btn-sm" onClick={() => setShowTransaction({ productId: product.id, type: 'OUT' })}
                            style={{ width: '30px', height: '30px', color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', borderRadius: 'var(--radius-sm)' }} title={t('outcome_title')}
                          ><ArrowDownCircle size={14} /></button>
                          <div style={{ width: '1px', background: 'var(--border-secondary)', margin: '0 4px' }} />
                          <button
                            className="btn btn-icon btn-sm" onClick={() => {
                               setEditingProduct(product)
                               setNewProduct({ name: product.name, sku: product.sku || '', quantity: product.quantity, price: product.price, unit: product.unit, minQuantity: product.minQuantity })
                               setShowAddProduct(true)
                            }}
                            style={{ width: '30px', height: '30px', color: 'var(--text-secondary)' }} title={t('edit')}
                          ><Edit2 size={14} /></button>
                          <button
                            className="btn btn-icon btn-sm" onClick={() => handleDeleteProduct(product.id)}
                            style={{ width: '30px', height: '30px', color: 'var(--error)' }} title={t('delete')}
                          ><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          
          {(!currentWarehouse.products || currentWarehouse.products.length === 0) && (
             <div className="empty-state">
              <div className="empty-state-icon"><Package size={32} /></div>
              <div className="empty-state-title">{t('wh_no_products')}</div>
              <div className="empty-state-text">{t('wh_no_products_desc')}</div>
            </div>
          )}
          
          {currentWarehouse.products && currentWarehouse.products.length > 0 && filteredProducts.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={32} /></div>
              <div className="empty-state-title">{t('wh_search_not_found')}</div>
              <div className="empty-state-text">{t('wh_search_not_found_desc')}</div>
            </div>
          )}
        </motion.div>
      )}

      {/* Add Warehouse Modal */}
      <AnimatePresence>
        {showAddWarehouse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAddWarehouse(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>{editingWarehouse ? t('edit_wh') : t('new_wh')}</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowAddWarehouse(false)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>{t('wh_name')} *</label>
                  <input type="text" className="input" placeholder={t('wh_name_placeholder')} value={newWarehouse.name} onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})} disabled={isSubmitting} />
                </div>
                
                <div className="input-group">
                  <label>{t('connect_bot_label')}</label>
                  <select 
                    className="input" 
                    value={(newWarehouse as any).botId || ''} 
                    onChange={(e) => setNewWarehouse({...newWarehouse, botId: e.target.value} as any)} 
                    disabled={isSubmitting || !!editingWarehouse}
                    style={{ appearance: 'auto' }}
                  >
                    <option value="" disabled>{t('select_bot_placeholder')}</option>
                    {bots.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (@{b.username})</option>
                    ))}
                  </select>
                  {!!editingWarehouse && <span style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '4px' }}>{t('wh_move_warning')}</span>}
                </div>

                <div className="input-group">
                  <label>{t('wh_desc')}</label>
                  <textarea className="input textarea" placeholder={t('wh_desc_placeholder')} value={newWarehouse.description} onChange={(e) => setNewWarehouse({...newWarehouse, description: e.target.value})} disabled={isSubmitting} />
                </div>
                <div className="input-group">
                  <label>{t('wh_location')}</label>
                  <input type="text" className="input" placeholder={t('wh_loc_placeholder')} value={newWarehouse.location} onChange={(e) => setNewWarehouse({...newWarehouse, location: e.target.value})} disabled={isSubmitting} />
                </div>
                <button className="btn btn-primary" onClick={handleSaveWarehouse} style={{ width: '100%' }} disabled={isSubmitting || !newWarehouse.name}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAddProduct(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>{editingProduct ? t('edit_product') : t('new_product')}</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowAddProduct(false)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>{t('product_name')} *</label>
                  <input type="text" className="input" placeholder={t('product_example')} value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} disabled={isSubmitting} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>{t('sku')}</label>
                    <input type="text" className="input" placeholder="IPH-15P" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} disabled={isSubmitting} />
                  </div>
                  <div className="input-group">
                    <label>{t('unit')}</label>
                    <select className="input" value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})} disabled={isSubmitting}>
                      <option value="dona">{t('unit_item')}</option>
                      <option value="kg">{t('unit_kg')}</option>
                      <option value="litr">{t('unit_liter')}</option>
                      <option value="metr">{t('unit_meter')}</option>
                      <option value="sht">{t('unit_pcs')}</option>
                      <option value="upakovka">{t('unit_pack')}</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <label>{t('initial_qty')}</label>
                    <input type="number" className="input" value={newProduct.quantity === 0 ? '' : newProduct.quantity} onChange={(e) => setNewProduct({...newProduct, quantity: +e.target.value})} disabled={isSubmitting} />
                  </div>
                  <div className="input-group">
                    <label>{t('price_sum')}</label>
                    <input type="number" className="input" value={newProduct.price === 0 ? '' : newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: +e.target.value})} disabled={isSubmitting} />
                  </div>
                </div>
                <div className="input-group">
                  <label>{t('min_qty_warning')}</label>
                  <input type="number" className="input" value={newProduct.minQuantity === 0 ? '' : newProduct.minQuantity} onChange={(e) => setNewProduct({...newProduct, minQuantity: +e.target.value})} disabled={isSubmitting} />
                </div>
                <button className="btn btn-primary" onClick={handleSaveProduct} style={{ width: '100%' }} disabled={isSubmitting || !newProduct.name}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {t('save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showTransaction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowTransaction(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {showTransaction.type === 'IN' ? (
                    <><ArrowUpCircle size={20} color="var(--success)" /> {t('income_title')}</>
                  ) : (
                    <><ArrowDownCircle size={20} color="var(--accent-rose)" /> {t('outcome_title')}</>
                  )}
                </h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setShowTransaction(null)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>{t('qty_label')}</label>
                  <input type="number" className="input" min="1" value={transactionQty} onChange={(e) => setTransactionQty(+e.target.value)} disabled={isSubmitting} />
                </div>
                <div className="input-group">
                  <label>{t('note_label')}</label>
                  <textarea className="input textarea" placeholder={t('optional_note_placeholder')} value={transactionNote} onChange={(e) => setTransactionNote(e.target.value)} disabled={isSubmitting} />
                </div>
                <button
                  className={`btn ${showTransaction.type === 'IN' ? 'btn-primary' : 'btn-danger'}`}
                  onClick={handleTransaction}
                  style={{ width: '100%' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : showTransaction.type === 'IN' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  {showTransaction.type === 'IN' ? ' ' + t('confirm_income_btn') : ' ' + t('confirm_outcome_btn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => !isDeleting && setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px',
                  background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AlertTriangle size={28} color="var(--error)" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  {deleteConfirm.type === 'warehouse' ? t('delete_wh_confirm') : t('delete_confirm')}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  <strong>&quot;{deleteConfirm.name}&quot;</strong>
                  {deleteConfirm.type === 'warehouse' && (
                    <span style={{ display: 'block', marginTop: '8px', color: 'var(--error)', fontSize: '13px' }}>
                      ⚠️ {"Barcha mahsulotlar ham o'chib ketadi!"}
                    </span>
                  )}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting} style={{ flex: 1 }}>
                    {t('cancel')}
                  </button>
                  <button
                    className="btn"
                    onClick={executeDelete}
                    disabled={isDeleting}
                    style={{ flex: 1, background: 'var(--error)', color: 'white', border: 'none' }}
                  >
                    {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    {' '}{t('delete') || "O'chirish"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
