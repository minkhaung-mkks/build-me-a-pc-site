import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

export default function ProfileEditPage() {
  const { user, refreshUser, isBuilder } = useAuth();
  const { updateUser, getBuilderProfile, updateBuilderProfile } = useData();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Builder-specific fields
  const [businessName, setBusinessName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        setDisplayName(user.display_name || '');
        setBio(user.bio || '');
        setAvatarUrl(user.avatar_url || '');

        if (isBuilder) {
          const profile = await getBuilderProfile(user.id);
          if (profile) {
            setBusinessName(profile.business_name || '');
            setSpecialization(profile.specialization || '');
            setWebsite(profile.website || '');
            setPortfolioUrl(profile.portfolio_url || '');
            setAddress(profile.address || '');
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, isBuilder, getBuilderProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setSaving(true);
    try {
      await updateUser(user.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });

      if (isBuilder) {
        await updateBuilderProfile(user.id, {
          business_name: businessName.trim() || null,
          specialization: specialization.trim() || null,
          website: website.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
          address: address.trim() || null,
        });
      }

      await refreshUser();
      navigate(`/profile/${user.id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user || loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="auth-page">
      <div className="card">
        <h1>Edit Profile</h1>
        <p>Update your profile information.</p>

        {error && <div className="alert alert--error">{error}</div>}
        {success && <div className="alert alert--success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name *</label>
            <input
              id="displayName"
              type="text"
              className="form-input"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              className="form-input"
              placeholder="Tell us about yourself..."
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="avatarUrl">Avatar URL</label>
            <input
              id="avatarUrl"
              type="url"
              className="form-input"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          {isBuilder && (
            <>
              <hr style={{ margin: '1.5rem 0' }} />
              <h2>Builder Profile</h2>

              <div className="form-group">
                <label htmlFor="businessName">Business Name</label>
                <input
                  id="businessName"
                  type="text"
                  className="form-input"
                  placeholder="Your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <input
                  id="specialization"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Gaming PCs, Workstations"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="url"
                  className="form-input"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="portfolioUrl">Portfolio URL</label>
                <input
                  id="portfolioUrl"
                  type="url"
                  className="form-input"
                  placeholder="https://portfolio.example.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  className="form-input"
                  placeholder="Business address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
