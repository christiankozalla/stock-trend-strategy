import { type FormEventHandler } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, Auth } from '../context/AuthContext';
import styles from "../components/css/Utils.module.css";

export function Login() {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');

  const handleSubmit: FormEventHandler<HTMLFormElement>  = (event) => {
    event.preventDefault();

    const body = new FormData(event.currentTarget);
    fetch(`/api/token`, {
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
          if (typeof jsonRes.access_token === 'string') {
            authContext.setAuth(new Auth(jsonRes as { access_token: string; token_type: 'bearer' }));
            navigate('/');
          } else {
            console.error('[Login] no access_token in payload', jsonRes);
          }
        }
      })
      .catch((e) => {
        console.log('[Login]', e);
        setFormError('An unexpected error occurred. Check your network connection.');
      })
      .finally(() => {
        console.log('Hello [username]', authContext.auth?.username);
      });
  };

  return (
    <div className={`${styles.centeredContainer} ${styles.authForm}`}>
      <Panel header={<h2>Log In</h2>} style={{ width: '25rem' }}>
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
            {formError && <Message severity="error" text={formError} />}
            <div className="p-field">
              <Button
                type="submit"
                label="Sign In"
                icon="pi pi-sign-in"
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
