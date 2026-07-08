export function BudgetBar({ spent, budget }) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const over = spent > budget
  return (
    <div className="budget-bar">
      <div className="budget-bar-track">
        <div
          className={`budget-bar-fill ${over ? 'budget-bar-over' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={over ? 'error' : ''}>
        {over
          ? `¥${(spent - budget).toLocaleString()} over budget today`
          : `¥${(budget - spent).toLocaleString()} left today`}
      </p>
    </div>
  )
}
