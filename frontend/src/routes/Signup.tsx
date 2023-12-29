import { Button, FormControl, FormLabel, Input, Container, Stack, Typography } from '@mui/joy';
import { type FormEventHandler, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, Auth } from '../context/AuthContext';
import { useFetch } from '../lib/hooks/useFetch';


export function Signup() {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate()
    const [formError, setFormError] = useState("");
    const { fetch } = useFetch(authContext);

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const body = new FormData(event.currentTarget);
        for (const [k, v] of body.entries()) {
            console.log(k, v);
        }
        fetch(`/api/register`, {
            method: 'POST',
            body,
        })
        .then((res) => {
            if (res?.headers.get("Content-Type") === 'application/json') return res.json();
            else throw res;
        })
        .then((jsonRes) => {
            if (jsonRes.detail) {
                if (typeof jsonRes.detail === 'string')
                    setFormError(jsonRes.detail);
            } else {
                authContext.setAuth(new Auth(jsonRes as { access_token: string; token_type: 'bearer' }));
                navigate("/");
            }

        })
        .catch((e) => { console.log("[Signup]", e); setFormError("An unexpected error occurred. Check your network connection.") })
        .finally(() => {
            console.log("Hello [username]", authContext.auth?.getUsername());
        });
    };

    return (
        <Container maxWidth="xs">
            <Typography component="h1" style={{ margin: "2rem 0 1rem 0" }}>
                Sign Up
            </Typography>
            <form onSubmit={handleSubmit} onChange={() => setFormError("")}>
                <Stack spacing={1}>
                    <FormControl>
                        <FormLabel>Username</FormLabel>
                        <Input
                            name="username"
                            placeholder="Galactic President Superstar McAwesomeville"
                            autoComplete="username"
                            autoFocus
                            required
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Password</FormLabel>
                        <Input
                            name="password"
                            placeholder="Password"
                            type="password"
                            autoComplete="current-password"
                            required
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Full Name</FormLabel>
                        <Input
                            name="full_name"
                            placeholder="Ted Mosby"
                            autoFocus
                            required
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                            name="email"
                            placeholder="ted.mosby@how-i-met-your-mother.com"
                            autoFocus
                            required
                        />
                    </FormControl>
                    {formError && <><span>{formError}</span></>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="solid"
                        color="primary"
                    >
                        Sign In
                    </Button>
                </Stack>
            </form>
        </Container >
    );
}