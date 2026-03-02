import { Routes, Route } from "react-router-dom"
import { lazy } from "react"

// Admin
const AdminDashboard = lazy(() => import('./Pages/Admin/Dashboard/AdminDashboard'))
const Students = lazy(() => import('./Pages/Admin/Students/Students'))
const StudentAdd = lazy(() => import('./Pages/Admin/StudentAdd/StudentAdd'))
const StudentsBulk = lazy(() => import('./Pages/Admin/StudentsBulk/StudentsBulk'))
const StudentDetail = lazy(() => import('./Pages/Admin/StudentDetail/StudentDetail'))
const StudentEdit = lazy(() => import('./Pages/Admin/StudentEdit/StudentEdit'))
const BulkOperations = lazy(() => import('./Pages/Admin/BulkOperations/BulkOperations'))
const AdminList = lazy(() => import('./Pages/Admin/AdminList/AdminList'))
const AddAdmin = lazy(() => import('./Pages/Admin/AddAdmin/AddAdmin'))
const AdminDetail = lazy(() => import('./Pages/Admin/AdminDetail/AdminDetail'))
const AdminEdit = lazy(() => import('./Pages/Admin/AdminEdit/AdminEdit'))
const CreateCourse = lazy(() => import("./Pages/Admin/CreateCourse/CreateCourse"))
const Courses = lazy(() => import("./Pages/Admin/Courses/Courses"))

export default function AdminRoute() {
    return (
        <Routes>
            <Route path="" element={<AdminDashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="student/add" element={<StudentAdd />} />
            <Route path="students/bulk" element={<StudentsBulk />} />
            <Route path="students/bulk-operation" element={<BulkOperations />} />
            <Route path="student/:id" element={<StudentDetail />} />
            <Route path="student/edit/:id" element={<StudentEdit />} />
            <Route path="staff" element={<AdminList />} />
            <Route path="staff/add" element={<AddAdmin />} />
            <Route path="staff/:id" element={<AdminDetail />} />
            <Route path="staff/edit/:id" element={<AdminEdit />} />
            <Route path="course/add" element={<CreateCourse />} />
            <Route path="courses" element={<Courses />} />
        </Routes>
    )
}