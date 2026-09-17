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

type Errors = FieldErrors & { confirmPassword?: string };

export function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  // Where to land afterwards — a room the guest was about to book, if that
  // is what brought them here. Login hands it over when they switch pages.
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mirrors RegisterDto: name 2–50, a valid email, password of at least 8.
  // confirmPassword is checked here and nowhere else — the API has no such
  // field, and its ValidationPipe rejects any body that carries one.
  function validate(): Errors {
    const next: Errors = {};
    const trimmed = name.trim();

    if (trimmed.length < 2) next.name = 'Enter at least 2 characters.';
    else if (trimmed.length > 50) next.name = 'Use 50 characters or fewer.';

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirmPassword !== password) {
      next.confirmPassword = 'This does not match the password above.';
    }

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
      await signUp({ name: name.trim(), email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ email: 'This email is already registered.' });
        setFormError('That account already exists. Sign in instead.');
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
      <CardTitle>Create your account</CardTitle>
      <CardSwitch>
        Already have an account?{' '}
        <Link
          to="/login"
          state={{ from }}
          className="text-brass-ink underline underline-offset-2 hover:text-ink"
        >
          Sign in
        </Link>
      </CardSwitch>

      {formError ? <FormError>{formError}</FormError> : null}

      <Field
        id="name"
        label="Full name"
        value={name}
        onChange={setName}
        error={errors.name}
        autoComplete="name"
        disabled={submitting}
        autoFocus
      />
      <Field
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        autoComplete="email"
        disabled={submitting}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        hint="At least 8 characters."
        autoComplete="new-password"
        disabled={submitting}
      />
      <Field
        id="confirmPassword"
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={errors.confirmPassword}
        autoComplete="new-password"
        disabled={submitting}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </Button>
    </CardForm>
  );
}
