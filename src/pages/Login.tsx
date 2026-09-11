import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api';
import type { FieldErrors } from '../api';
import { useAuth } from '../auth';
import { Button } from '../components/Button';
import { CardForm, CardSwitch, CardTitle } from '../components/Card';
import { Field } from '../components/Field';
import { FormError } from '../components/FormError';
import { FormNotice } from '../components/FormNotice';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  // A one-time confirmation handed over by the reset-password page.
  const notice = (useLocation().state as { notice?: string } | null)?.notice;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length === 0) next.password = 'Enter your password.';
    return next;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // The API answers both "no such user" and "wrong password" with the
        // same 401 so the form cannot be used to discover which emails have
        // accounts. Keeping one message here preserves that.
        setFormError('That email and password do not match.');
        setPassword('');
      } else if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
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
      <CardTitle>Sign in</CardTitle>
      <CardSwitch>
        New here?{' '}
        <Link to="/signup" className="text-brass-ink underline underline-offset-2 hover:text-ink">
          Create an account
        </Link>
      </CardSwitch>

      {formError ? (
        <FormError>{formError}</FormError>
      ) : notice ? (
        <FormNotice>{notice}</FormNotice>
      ) : null}

      <Field
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
        disabled={submitting}
        autoFocus
      />
      <Field
        id="password"
        label="Password"
        labelAside={
          <Link
            to="/forgot-password"
            className="text-[12.5px] text-brass-ink underline underline-offset-2 hover:text-ink"
          >
            Forgot password?
          </Link>
        }
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        autoComplete="current-password"
        disabled={submitting}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </CardForm>
  );
}
