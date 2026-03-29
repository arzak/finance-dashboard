import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './AuthContext.jsx'
import { useAuth } from './AuthContext.jsx'
import { FinanceProvider } from './contexts/FinanceContext.jsx'
import './index.css'

const App = lazy(() => import('./App.jsx'))
const AuthScreen = lazy(() => import('./AuthScreen.jsx'))

function Root() {
    const { currentUser } = useAuth();
    return currentUser ? (
        <FinanceProvider>
            <Suspense fallback={null}>
                <App />
            </Suspense>
        </FinanceProvider>
    ) : (
        <Suspense fallback={null}>
            <AuthScreen />
        </Suspense>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <Root />
        </AuthProvider>
    </React.StrictMode>,
)
