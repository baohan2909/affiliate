// Thanh tỉ lệ + bảng số bán theo kênh (Shopee, TikTok Shop, Lazada…)
import { mauKenh, phanTram, tenKenh, xepKenh } from '../lib/kenh'
import { fmtSo } from '../lib/format'

export function ThanhKenh({ bk, gon }) {
  const ds = xepKenh(bk)
  if (!ds.length) return null
  return (
    <div className={'kenh-ban' + (gon ? ' gon' : '')}>
      <div className="kenh-thanh" role="img" aria-label={ds.map(([k, , p]) => `${tenKenh(k)} ${phanTram(p)}`).join(', ')}>
        {ds.map(([k, , p]) => <span key={k} style={{ width: p + '%', background: mauKenh(k) }} title={`${tenKenh(k)} ${phanTram(p)}`} />)}
      </div>
      <div className="kenh-ds">
        {ds.map(([k, v, p]) => (
          <div key={k} className="kenh-dong">
            <i style={{ background: mauKenh(k) }} />
            <span className="ten">{tenKenh(k)}</span>
            <b>{fmtSo(v)}</b>
            <small>{phanTram(p)}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
