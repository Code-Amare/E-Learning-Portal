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
import MyLearningTask from './Pages/User/MyLearningTask/MyLearningTask'
import EmailLogin from "./Pages/EmailLogin/EmailLogin"
import PublicRoute from './Components/PublicRoute/PublicRoute'
import UserLearningTaskDetail from './Pages/User/LearningTaskDetail/LearningTaskDetail'
import LanguagesAdd from './Pages/Admin/LanguagesAdd/LanguagesAdd'
import LanguagesList from './Pages/Admin/LanguagesList/LanguagesList'
import LanguagesEdit from './Pages/Admin/LanguagesEdit/LanguagesEdit'
import FrameworkAdd from './Pages/Admin/FrameworkAdd/FrameworkAdd'
import FrameworksList from './Pages/Admin/FrameworksList/FrameworksList'
import FrameworksEdit from './Pages/Admin/FrameworksEdit/FrameworksEdit'
import AdminLearningTasksList from './Pages/Admin/LearningTasksList/LearningTasksList';
import UserLearningTasksList from './Pages/User/LearningTasksList/LearningTasksList';
import LearningTaskCreate from './Pages/User/LearningTaskCreate/LearningTaskCreate'
import LearningTaskEdit from './Pages/User/LearningTaskEdit/LearningTaskEdit'
import AdminLearningTaskDetail from "./Pages/Admin/LearningTaskDetail/LearningTaskDetail"
import StudentEdit from './Pages/Admin/StudentEdit/StudentEdit'
import ResetPassword from './Pages/ResetPassword/ResetPassword'
import ResetPasswordViaCode from './Pages/ResetPasswordviaCode/ResetPasswordViaCode'
import TaskLimitBulk from "./Pages/Admin/TaskLimitBulk/TaskLimitBulk"
import NotificationsList from './Pages/NotificationList/NotificationsList'
import NotificationDetail from './Pages/NotificationDetail/NotificationDetail'
import AttendanceList from './Pages/Admin/AttendanceList/AttendanceList'
import CreateAttendanceSession from './Pages/Admin/CreateAttendanceSession/CreateAttendanceSession'
import SessionDetail from './Pages/Admin/SessionDetail/SessionDetail'
import MarkAttendance from "./Pages/Admin/MarkAttendance/MarkAttendance"
import StudentLearningTasks from './Pages/Admin/StudentLearningTasks/StudentLearningTasks'
import UserAttendance from './Pages/User/UserAttendance/UserAttendance'
import AnnouncementList from './Pages/Admin/AnnouncementList/AnnouncementList'
import CreateAnnouncement from './Pages/Admin/CreateAnnouncement/CreateAnnouncement'
import AdminAnnouncementDetail from "./Pages/Admin/AnnouncementDetail/AnnouncementDetail"
import UserAnnouncementDetail from "./Pages/User/AnnouncementDetail/AnnouncementDetail"
import EditAnnouncement from "./Pages/Admin/EditAnnouncement/EditAnnouncement"
import UserAnnouncements from './Pages/User/UserAnnouncements/UserAnnouncements'
import BulkOperations from './Pages/Admin/BulkOperations/BulkOperations'
import AdminList from "./Pages/Admin/AdminList/AdminList"
import AddAdmin from './Pages/Admin/AddAdmin/AddAdmin'
import AdminDetail from './Pages/Admin/AdminDetail/AdminDetail'
import AdminEdit from './Pages/Admin/AdminEdit/AdminEdit'
import Register from './Pages/Register/Register'

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
          <Route path="/admin/languages/add" element={<LanguagesAdd />} />
          <Route path="/admin/languages/edit/:id" element={<LanguagesEdit />} />
          <Route path="/admin/languages" element={<LanguagesList />} />
          <Route path="/admin/frameworks" element={<FrameworksList />} />
          <Route path="/admin/frameworks/add" element={<FrameworkAdd />} />
          <Route path="/admin/frameworks/edit/:id" element={<FrameworksEdit />} />
          <Route path="/admin/learning-tasks" element={<AdminLearningTasksList />} />
          <Route path="/admin/learning-task/:taskId" element={<AdminLearningTaskDetail />} />
          <Route path="/admin/task-limit" element={<TaskLimitBulk />} />
          <Route path="/admin/attendance" element={<AttendanceList />} />
          <Route path="/admin/attendance/create" element={<CreateAttendanceSession />} />
          <Route path="/admin/session/:sessionId" element={<SessionDetail />} />
          <Route path="/admin/session/edit/:sessionId" element={<MarkAttendance />} />
          <Route path="/admin/student/task/:id" element={<StudentLearningTasks />} />
          <Route path="/admin/announcements" element={<AnnouncementList />} />
          <Route path="/admin/announcement/create" element={<CreateAnnouncement />} />
          <Route path="/admin/announcement/:announcementId" element={<AdminAnnouncementDetail />} />
          <Route path="/admin/announcement/edit/:announcementId" element={<EditAnnouncement />} />
          <Route path="/admin/students/bulk-operation" element={<BulkOperations />} />
          <Route path="/admin/staff" element={<AdminList />} />
          <Route path="/admin/staff/add" element={<AddAdmin />} />
          <Route path="/admin/staff/:id" element={<AdminDetail />} />
          <Route path="/admin/staff/edit/:id" element={<AdminEdit />} />
        </Route>
        <Route element={<ProtectedRoute requiredRole={["user"]} />}>
          <Route path='/user' element={<UserDashboard />} />
          <Route path='/user/my-learning-task' element={<MyLearningTask />} />
          <Route path='/user/learning-tasks' element={<UserLearningTasksList />} />
          <Route path='/user/learning-task/create' element={<LearningTaskCreate />} />
          <Route path='/user/learning-task/:id' element={<UserLearningTaskDetail />} />
          <Route path='/user/learning-task/edit/:id' element={<LearningTaskEdit />} />
          <Route path='/user/attendance' element={<UserAttendance />} />
          <Route path='/user/announcements' element={<UserAnnouncements />} />
          <Route path='/user/announcement/:announcementId' element={<UserAnnouncementDetail />} />
        </Route>
        <Route path='*' element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
