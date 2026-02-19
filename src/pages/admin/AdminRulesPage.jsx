import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';

export default function AdminRulesPage() {
  const { getCompatibilityRules, updateCompatibilityRule } = useData();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingRule, setViewingRule] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCompatibilityRules();
        setRules(data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getCompatibilityRules]);

  const handleToggleActive = async (rule) => {
    try {
      const updated = await updateCompatibilityRule(rule.id, { is_active: !rule.is_active });
      setRules(rules.map(r => r.id === rule.id ? updated : r));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleSeverityChange = async (rule, newSeverity) => {
    try {
      const updated = await updateCompatibilityRule(rule.id, { severity: newSeverity });
      setRules(rules.map(r => r.id === rule.id ? updated : r));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Compatibility Rules</h1>
        <p>Manage PC part compatibility validation rules. Rules are checked when users create or edit builds.</p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>#</th>
            <th>Name</th>
            <th style={{ width: '120px' }}>Severity</th>
            <th style={{ width: '100px' }}>Status</th>
            <th style={{ width: '120px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td><strong>{rule.rule_number}</strong></td>
              <td>
                <div>{rule.name}</div>
                {rule.description && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {rule.description}
                  </div>
                )}
              </td>
              <td>
                <select
                  className="form-select"
                  value={rule.severity}
                  onChange={(e) => handleSeverityChange(rule, e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                </select>
              </td>
              <td>
                <span className={rule.is_active ? 'badge badge--success' : 'badge badge--danger'}>
                  {rule.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button
                  className="btn btn--small btn--outline"
                  onClick={() => handleToggleActive(rule)}
                >
                  {rule.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="btn btn--small btn--ghost"
                  onClick={() => setViewingRule(rule)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {viewingRule && (
        <div className="modal-overlay" onClick={() => setViewingRule(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal__header">
              <h2>Rule #{viewingRule.rule_number}: {viewingRule.name}</h2>
              <button className="modal__close" onClick={() => setViewingRule(null)}>&times;</button>
            </div>
            <div className="modal__body">
              {viewingRule.description && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Description:</strong>
                  <p>{viewingRule.description}</p>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <strong>Severity:</strong>
                <span className={viewingRule.severity === 'error' ? 'badge badge--danger' : 'badge badge--warning'} style={{ marginLeft: '0.5rem' }}>
                  {viewingRule.severity}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Status:</strong>
                <span className={viewingRule.is_active ? 'badge badge--success' : 'badge badge--danger'} style={{ marginLeft: '0.5rem' }}>
                  {viewingRule.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>Message Template:</strong>
                <div style={{ 
                  background: 'var(--color-bg-secondary, #f5f5f5)', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  marginTop: '0.5rem'
                }}>
                  {viewingRule.message_template}
                </div>
              </div>

              <div>
                <strong>Rule Configuration:</strong>
                <pre style={{ 
                  background: 'var(--color-bg-secondary, #f5f5f5)', 
                  padding: '0.75rem', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  overflow: 'auto',
                  marginTop: '0.5rem'
                }}>
                  {JSON.stringify(viewingRule.rule_config, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}