import { Button, FormControl, FormLabel, Input, Container, Stack, Typography } from '@mui/joy';
import { type FormEventHandler, useState, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';

export function Login() {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const [formError, setFormError] = useState("");
    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const body = new FormData(event.currentTarget);
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/token`, {
            method: 'POST',
            credentials: import.meta.env.PROD ? 'same-origin' : 'include', // this makes sure, a refresh-token can be set via a set-cookie response header
            body,
        })
            .then((res) => res.json())
            .then((jsonRes) => {
                if (jsonRes.detail) {
                    if (typeof jsonRes.detail === 'string')
                        setFormError(jsonRes.detail);
                } else {
                    authContext.setAccessToken(jsonRes as { access_token: string; token_type: 'bearer' });
                    navigate("/");
                }

            })
            .catch(() => { setFormError("An unexpected error occurred. Check your network connection.") })
            .finally(() => {
                console.log("Hello [username]", authContext.getUsername());
            });
    };

    return (
        <Container maxWidth="xs">
            <Typography component="h1" style={{ margin: "2rem 0 1rem 0" }}>
                Sign In
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