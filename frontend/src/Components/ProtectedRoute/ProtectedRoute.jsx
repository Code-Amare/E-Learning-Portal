import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '../../Context/UserContext'
import GetSpinner from "../../Components/GetSpinner/GetSpinner"
import { neonToast } from "../../Components/NeonToast/NeonToast";


function ProtectedRoute({ requiredRole }) {
    const { user } = useUser()
    const location = useLocation()
    // console.log(user)

    if (user.isAuthenticated === null) return <div><GetSpinner /></div>

    if (user.isAuthenticated === false || !requiredRole.includes(user.role)) {
        neonToast.error("You do not have permission to view this page") // correct the grammer
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
    }

    return <Outlet /> // this renders the nested route
}

export default ProtectedRoute
