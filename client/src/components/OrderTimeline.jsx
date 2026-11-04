import { ORDER_STATUS, dateTime } from '../utils/format';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderTimeline({ order }) {
  if (order.status === 'cancelled') return <div className="alert alert-bad">تم إلغاء هذا الطلب.</div>;
  const idx = STEPS.indexOf(order.status);
  const at = (s) => order.statusHistory?.filter((h) => h.status === s).pop()?.at;
  return (
    <ol className="timeline">
      {STEPS.map((s, i) => (
        <li key={s} className={i <= idx ? 'done' : ''}>
          <span className="dot">{i <= idx ? '✓' : i + 1}</span>
          <b>{ORDER_STATUS[s]}</b>
          {at(s) && <small>{dateTime(at(s))}</small>}
        </li>
      ))}
    </ol>
  );
}
