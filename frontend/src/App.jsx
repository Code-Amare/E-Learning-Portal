import { Routes, Route } from 'react-router-dom'
import ScrollToTop from "./Utils/ScrollToTop"
import Home from './Pages/Home/Home'
import Profile from './Pages/Profile/Profile'
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute'
import Login from './Pages/Login/Login'
import NotFound from './Pages/NotFound/NotFound'
import VerifyEmail from './Pages/VerifyEmail/VerifyEmail'
import NeonToast from './Components/NeonToast/NeonToast'
import Security from './Pages/Security/Security'
import ProfileEdit from './Pages/EditProfile/EditProfile'
import Notification from './Components/Notification/Notification'
import Settings from './Pages/Settings/Settings'
import Students from './Pages/Admin/Students/Students'
import StudentAdd from './Pages/Admin/StudentAdd/StudentAdd'
import StudentsBulk from './Pages/Admin/StudentsBulk/StudentsBulk'
import StudentDetail from './Pages/Admin/StudentDetail/StudentDetail'
import UserDashboard from './Pages/User/UserDashboard/UserDashboard'
import AdminDashboard from './Pages/Admin/Dashboard/AdminDashboard'
import EmailLogin from "./Pages/EmailLogin/EmailLogin"
import PublicRoute from './Components/PublicRoute/PublicRoute'
import StudentEdit from './Pages/Admin/StudentEdit/StudentEdit'
import ResetPassword from './Pages/ResetPassword/ResetPassword'
import ResetPasswordViaCode from './Pages/ResetPasswordviaCode/ResetPasswordViaCode'
import NotificationsList from './Pages/NotificationList/NotificationsList'
import NotificationDetail from './Pages/NotificationDetail/NotificationDetail'
import BulkOperations from './Pages/Admin/BulkOperations/BulkOperations'
import AdminList from "./Pages/Admin/AdminList/AdminList"
import AddAdmin from './Pages/Admin/AddAdmin/AddAdmin'
import AdminDetail from './Pages/Admin/AdminDetail/AdminDetail'
import AdminEdit from './Pages/Admin/AdminEdit/AdminEdit'
import Register from './Pages/Register/Register'
import CreateCourse from './Pages/Admin/CreateCourse/CreateCourse'
import Courses from './Pages/Admin/Courses/Courses'
import CourseDetail from './Pages/Admin/CourseDetail/CourseDetail'
import CourseEdit from './Pages/Admin/CourseEdit/CourseEdit'
import StudentCourses from "./Pages/Admin/StudentCourses/StudentCourses"

function App() {
  return (
    <>
      <Notification />
      <NeonToast />
      <ScrollToTop />
      <Routes>

        <Route element={<PublicRoute />}>
          <Route path="/" element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/verify-email' element={<VerifyEmail />} />
          <Route path='/login/email' element={<EmailLogin />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole={["admin", "user"]} />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/security" element={<Security />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/password/reset/code" element={<ResetPasswordViaCode />} />
          <Route path="/password/reset/:signed_inst" element={<ResetPassword />} />
          <Route path="/notifications" element={<NotificationsList />} />
          <Route path="/notification/:notif_id/" element={<NotificationDetail />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/staff" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/student/add" element={<StudentAdd />} />
          <Route path="/admin/students/bulk" element={<StudentsBulk />} />
          <Route path="/admin/student/:id" element={<StudentDetail />} />
          <Route path="/admin/student/edit/:id" element={<StudentEdit />} />
          <Route path="/admin/students/bulk-operation" element={<BulkOperations />} />
          <Route path="/admin/staff" element={<AdminList />} />
          <Route path="/admin/staff/add" element={<AddAdmin />} />
          <Route path="/admin/staff/:id" element={<AdminDetail />} />
          <Route path="/admin/staff/edit/:id" element={<AdminEdit />} />
          <Route path="/admin/courses/create" element={<CreateCourse />} />
          <Route path="/admin/courses" element={<Courses />} />
          <Route path="/admin/courses/:id" element={<CourseDetail />} />
          <Route path="/admin/courses/edit/:id" element={<CourseEdit />} />
          <Route path="/admin/student/courses/:userId" element={<StudentCourses />} />
        </Route>

        <Route element={<ProtectedRoute requiredRole={["user"]} />}>
          <Route path='/user' element={<UserDashboard />} />
        </Route>

        <Route path='*' element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App