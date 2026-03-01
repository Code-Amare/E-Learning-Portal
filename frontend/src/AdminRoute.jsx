import { Routes, Route } from "react-router-dom"
// Admin
const AdminDashboard = lazy(() => import('./Pages/Admin/Dashboard/AdminDashboard'))
const Students = lazy(() => import('./Pages/Admin/Students/Students'))
const StudentAdd = lazy(() => import('./Pages/Admin/StudentAdd/StudentAdd'))
const StudentsBulk = lazy(() => import('./Pages/Admin/StudentsBulk/StudentsBulk'))
const StudentDetail = lazy(() => import('./Pages/Admin/StudentDetail/StudentDetail'))
const StudentEdit = lazy(() => import('./Pages/Admin/StudentEdit/StudentEdit'))
const LanguagesAdd = lazy(() => import('./Pages/Admin/LanguagesAdd/LanguagesAdd'))
const LanguagesEdit = lazy(() => import('./Pages/Admin/LanguagesEdit/LanguagesEdit'))
const LanguagesList = lazy(() => import('./Pages/Admin/LanguagesList/LanguagesList'))
const FrameworkAdd = lazy(() => import('./Pages/Admin/FrameworkAdd/FrameworkAdd'))
const FrameworksList = lazy(() => import('./Pages/Admin/FrameworksList/FrameworksList'))
const FrameworksEdit = lazy(() => import('./Pages/Admin/FrameworksEdit/FrameworksEdit'))
const AdminLearningTasksList = lazy(() => import('./Pages/Admin/LearningTasksList/LearningTasksList'))
const AdminLearningTaskDetail = lazy(() => import('./Pages/Admin/LearningTaskDetail/LearningTaskDetail'))
const TaskLimitBulk = lazy(() => import('./Pages/Admin/TaskLimitBulk/TaskLimitBulk'))
const AttendanceList = lazy(() => import('./Pages/Admin/AttendanceList/AttendanceList'))
const CreateAttendanceSession = lazy(() => import('./Pages/Admin/CreateAttendanceSession/CreateAttendanceSession'))
const SessionDetail = lazy(() => import('./Pages/Admin/SessionDetail/SessionDetail'))
const MarkAttendance = lazy(() => import('./Pages/Admin/MarkAttendance/MarkAttendance'))
const StudentLearningTasks = lazy(() => import('./Pages/Admin/StudentLearningTasks/StudentLearningTasks'))
const AnnouncementList = lazy(() => import('./Pages/Admin/AnnouncementList/AnnouncementList'))
const CreateAnnouncement = lazy(() => import('./Pages/Admin/CreateAnnouncement/CreateAnnouncement'))
const AdminAnnouncementDetail = lazy(() => import('./Pages/Admin/AnnouncementDetail/AnnouncementDetail'))
const EditAnnouncement = lazy(() => import('./Pages/Admin/EditAnnouncement/EditAnnouncement'))
const BulkOperations = lazy(() => import('./Pages/Admin/BulkOperations/BulkOperations'))
const AdminList = lazy(() => import('./Pages/Admin/AdminList/AdminList'))
const AddAdmin = lazy(() => import('./Pages/Admin/AddAdmin/AddAdmin'))
const AdminDetail = lazy(() => import('./Pages/Admin/AdminDetail/AdminDetail'))
const AdminEdit = lazy(() => import('./Pages/Admin/AdminEdit/AdminEdit'))



export default function AdminRoute() {
    return (
        <Routes>
            <Route path="" element={<AdminDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="student/add" element={<StudentAdd />} />
            <Route path="students/bulk" element={<StudentsBulk />} />
            <Route path="student/:id" element={<StudentDetail />} />
            <Route path="student/edit/:id" element={<StudentEdit />} />
            <Route path="languages" element={<LanguagesList />} />
            <Route path="languages/add" element={<LanguagesAdd />} />
            <Route path="languages/edit/:id" element={<LanguagesEdit />} />
            <Route path="frameworks" element={<FrameworksList />} />
            <Route path="frameworks/add" element={<FrameworkAdd />} />
            <Route path="frameworks/edit/:id" element={<FrameworksEdit />} />
            <Route path="learning-tasks" element={<AdminLearningTasksList />} />
            <Route path="learning-task/:taskId" element={<AdminLearningTaskDetail />} />
            <Route path="task-limit" element={<TaskLimitBulk />} />
            <Route path="attendance" element={<AttendanceList />} />
            <Route path="attendance/create" element={<CreateAttendanceSession />} />
            <Route path="session/:sessionId" element={<SessionDetail />} />
            <Route path="session/edit/:sessionId" element={<MarkAttendance />} />
            <Route path="student/task/:id" element={<StudentLearningTasks />} />
            <Route path="announcements" element={<AnnouncementList />} />
            <Route path="announcement/create" element={<CreateAnnouncement />} />
            <Route path="announcement/:announcementId" element={<AdminAnnouncementDetail />} />
            <Route path="announcement/edit/:announcementId" element={<EditAnnouncement />} />
            <Route path="students/bulk-operation" element={<BulkOperations />} />
            <Route path="staff" element={<AdminList />} />
            <Route path="staff/add" element={<AddAdmin />} />
            <Route path="staff/:id" element={<AdminDetail />} />
            <Route path="staff/edit/:id" element={<AdminEdit />} />
        </Routes>
    )
}