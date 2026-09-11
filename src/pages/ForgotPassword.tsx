import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { ApiError } from '../api';
import { Button } from '../components/Button';
import { Card, CardForm, CardSwitch, CardTitle } from '../components/Card';
import { Field } from '../components/Field';
import { FormError } from '../components/FormError';

const link = 'text-brass-ink underline underline-offset-2 hover:text-ink';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError('');

    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // The same screen whether or not the address has an account. Saying
  // "we couldn't find that email" here would hand out exactly the
  // information the API's generic 200 exists to withhold.
  if (sent) {
    return (
      <Card>
        <CardTitle>Check your email</CardTitle>
        <CardSwitch>
          If <span className="text-ink">{email.trim()}</span> is registered, a reset
          link is on its way. It expires shortly, so use it soon.
        </CardSwitch>
        <p className="text-[13.5px] text-graphite">
          Nothing arrived?{' '}
          <button
            type="button"
            className={`${link} cursor-pointer bg-transparent p-0 font-[inherit]`}
            onClick={() => setSent(false)}
          >
            Try another address
          </button>{' '}
          or{' '}
          <Link to="/login" className={link}>
            go back to sign in
          </Link>
          .
        </p>
      </Card>
    );
  }

  return (
    <CardForm onSubmit={handleSubmit}>
      <CardTitle>Reset your password</CardTitle>
      <CardSwitch>
        Enter the email you signed up with and we&rsquo;ll send a link to choose a new
        password.
      </CardSwitch>

      {formError ? <FormError>{formError}</FormError> : null}

      <Field
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={emailError}
        autoComplete="email"
        disabled={submitting}
        autoFocus
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send reset link'}
      </Button>

      <p className="mt-[18px] text-center text-[13.5px] text-graphite">
        Remembered it?{' '}
        <Link to="/login" className={link}>
          Sign in
        </Link>
      </p>
    </CardForm>
  );
}
