import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../api';
import { ApiError } from '../api';
import { Button } from '../components/Button';
import { Card, CardForm, CardSwitch, CardTitle } from '../components/Card';
import { Field } from '../components/Field';
import { FormError } from '../components/FormError';

const link = 'text-brass-ink underline underline-offset-2 hover:text-ink';

export function ResetPassword() {
  const navigate = useNavigate();
  // The token rides in on the emailed link: /reset-password?token=…
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState('');
  const [linkDead, setLinkDead] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <Card>
        <CardTitle>This link isn&rsquo;t complete</CardTitle>
        <CardSwitch>
          The reset link is missing its token — it may have been cut off when it was
          copied.
        </CardSwitch>
        <Link to="/forgot-password" className={link}>
          Request a new link
        </Link>
      </Card>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');

    // Mirrors ResetPasswordDto's floor of 8, the same rule as sign-up.
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirm !== password) next.confirm = 'This does not match the password above.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      // Hand the login page a notice to show; the state does not survive a
      // refresh, which is fine for a one-time confirmation.
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password has been reset. Sign in with the new one.' },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Forged, expired and already-used tokens all arrive here. The API
        // does not say which, and neither does this.
        setLinkDead(true);
        setFormError('This reset link is invalid or has expired.');
      } else if (error instanceof ApiError) {
        if (error.fieldErrors.newPassword) {
          setErrors({ password: error.fieldErrors.newPassword });
        }
        setFormError(error.message);
      } else {
        setFormError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CardForm onSubmit={handleSubmit}>
      <CardTitle>Choose a new password</CardTitle>
      <CardSwitch>
        {linkDead ? (
          <>
            Reset links only work once and expire quickly.{' '}
            <Link to="/forgot-password" className={link}>
              Request a new one
            </Link>
            .
          </>
        ) : (
          'This replaces your old password straight away.'
        )}
      </CardSwitch>

      {formError ? <FormError>{formError}</FormError> : null}

      <Field
        id="password"
        label="New password"
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        hint="At least 8 characters."
        autoComplete="new-password"
        disabled={submitting || linkDead}
        autoFocus
      />
      <Field
        id="confirm"
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm}
        autoComplete="new-password"
        disabled={submitting || linkDead}
      />

      <Button type="submit" disabled={submitting || linkDead}>
        {submitting ? 'Resetting…' : 'Reset password'}
      </Button>
    </CardForm>
  );
}
