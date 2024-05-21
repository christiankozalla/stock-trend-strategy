import { type FormEventHandler, useState, useContext } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';
import { useNavigate } from 'react-router-dom';
import { AuthContext, Auth } from '../context/AuthContext';
import { useFetch } from '../lib/hooks/useFetch';
import styles from "../components/css/Utils.module.css";

export function Signup() {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const { fetch } = useFetch(authContext);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const body = new FormData(event.currentTarget);
    fetch(`/api/register`, {
      method: 'POST',
      body,
    })
      .then((res) => {
        if (res?.headers.get('Content-Type') === 'application/json') return res.json() as Promise<Record<string, unknown>>;
        else throw res;
      })
      .then((jsonRes) => {
        if (typeof jsonRes?.detail === 'string') {
          setFormError(jsonRes.detail);
        } else {
          authContext.setAuth(new Auth(jsonRes as { access_token: string; token_type: 'bearer' }));
          navigate('/');
        }
      })
      .catch((e) => {
        console.log('[Signup]', e);
        setFormError('An unexpected error occurred. Check your network connection.');
      })
      .finally(() => {
        console.log('Hello [username]', authContext.auth?.username);
      });
  };

  return (
    <div className={`${styles.centeredContainer} ${styles.authForm}`}>
      <Panel header={<h2>Sign Up</h2>} style={{ width: '25rem' }}>
        <form onSubmit={handleSubmit} onChange={() => setFormError('')}>
          <div className="p-fluid">
            <div className="p-field">
              <label htmlFor="username">Username</label>
              <InputText
                id="username"
                name="username"
                placeholder="Galactic President Superstar McAwesomeville"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
            <div className="p-field">
              <label htmlFor="password">Password</label>
              <InputText
                id="password"
                name="password"
                placeholder="Password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="p-field">
              <label htmlFor="full_name">Full Name</label>
              <InputText
                id="full_name"
                name="full_name"
                placeholder="Ted Mosby"
                autoFocus
                required
              />
            </div>
            <div className="p-field">
              <label htmlFor="email">Email</label>
              <InputText
                id="email"
                name="email"
                placeholder="ted.mosby@how-i-met-your-mother.com"
                autoFocus
                required
              />
            </div>
            {formError && <Message severity="error" text={formError} />}
            <div className="p-field">
              <Button
                type="submit"
                label="Sign Up"
                icon="pi pi-user-plus"
                iconPos="right"
                className="p-mt-2"
              />
            </div>
          </div>
        </form>
      </Panel>
    </div>
  );
}
