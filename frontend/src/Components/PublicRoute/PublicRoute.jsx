import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../../Context/UserContext'
import GetSpinner from "../../Components/GetSpinner/GetSpinner"


function PublicRoute() {
    const { user } = useUser()
    const navigate = useNavigate()
    // console.log(user)

    if (user.isAuthenticated === null) return <div><GetSpinner /></div>

    if (user.isAuthenticated === true && user?.role) {
        navigate(`/${user.role}`)
    }

    return <Outlet /> // this renders the nested route
}

export default PublicRoute
