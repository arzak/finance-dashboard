import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import AuthScreen from './AuthScreen.jsx'
import { useAuth } from './AuthContext.jsx'
import './index.css'

function Root() {
    const { currentUser } = useAuth();
    return currentUser ? <App /> : <AuthScreen />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <Root />
        </AuthProvider>
    </React.StrictMode>,
)
