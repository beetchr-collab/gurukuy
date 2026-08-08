"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function Navbar() {
    const { user, logout } = useAuth();

    const toggleSidebar = () => {
        const body = document.body;

        if (body.classList.contains("sidebar-collapse")) {
            body.classList.remove("sidebar-collapse");
            body.classList.add("sidebar-open");
        } else {
            body.classList.add("sidebar-collapse");
            body.classList.remove("sidebar-open");
        }
    }

    useEffect(() => {
        console.log(user); // ✅ BENAR (di dalam component)
    }, [user]);

    useEffect(() => {
        const handleClick = () => {
            if (window.innerWidth < 992) {
                document.body.classList.remove("sidebar-open");
            }
        };

        document
            .querySelector(".app-main")
            ?.addEventListener("click", handleClick);

        return () => {
            document
                .querySelector(".app-main")
                ?.removeEventListener("click", handleClick);
        };
    }, []);

    useEffect(() => {
        console.log("USER:", user);
        console.log("PHOTO:", user?.photo);
    }, [user]);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <nav className="app-header navbar navbar-expand bg-secondary-subtle" style={{
            background: "linear-gradient(90deg, #0d6efd, #6610f2)"
        }}>
            {/* begin::Container */}
            <div className="container-fluid">
                {/* begin::Start Navbar Links */}
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <button className="nav-link" onClick={toggleSidebar}>
                            <i className="fas fa-bars"></i>
                        </button>
                    </li>
                </ul>
                {/* end::Start Navbar Links */}

                {/* begin::End Navbar Links */}
                <ul className="navbar-nav ms-auto">
                    {/*begin::Fullscreen Toggle*/}
                    <li className="nav-item">
                        <a className="nav-link" href="#" data-lte-toggle="fullscreen">
                            <i data-lte-icon="maximize" className="bi bi-arrows-fullscreen"></i>
                            <i data-lte-icon="minimize" className="bi bi-fullscreen-exit" style={{ display: 'none' }}></i>
                        </a>
                    </li>
                    {/*end::Fullscreen Toggle*/}

                    {/*begin::User Menu Dropdown*/}
                    <li className="nav-item dropdown user-menu">
                        <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">
                            <img
                                src={
                                    user?.photo
                                        ? user.photo.replace(/"/g, '') + '?sz=100'
                                        : '/default-avatar.png'
                                }
                                className="user-image rounded-circle shadow"
                                alt="User Image"
                            />
                            <span className="d-none d-md-inline"> {user?.username || "User"}</span>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                            {/*begin::User Image*/}
                            <li className="user-header text-bg-primary-subtle text-center">
                                <img
                                    src={
                                        user?.photo
                                            ? user.photo.replace(/"/g, '') + '?sz=100'
                                            : '/default-avatar.png'
                                    }
                                    className="rounded-circle shadow d-block mx-auto mb-2"
                                    alt="User Image"
                                    style={{ width: 100, height: 100, objectFit: 'cover' }}
                                />

                                <p className="mb-0">
                                    {user?.username || "User"} - Web Developer
                                    <br />
                                    <small>Member since Nov. 2023</small>
                                </p>
                            </li>
                            {/*end::User Image*/}
                            {/*begin::Menu Body*/}
                            <li className="user-body">
                                {/*begin::Row*/}
                                <div className="row">
                                    <div className="col-4 text-center">
                                        <a href="#">Followers</a>
                                    </div>
                                    <div className="col-4 text-center">
                                        <a href="#">Sales</a>
                                    </div>
                                    <div className="col-4 text-center">
                                        <a href="#">Friends</a>
                                    </div>
                                </div>
                                {/*end::Row*/}
                            </li>
                            {/*end::Menu Body*/}
                            {/*begin::Menu Footer*/}
                            <li className="user-footer">
                                <a href="/admin/guru/profil" className="btn btn-primary btn-flat">Profil</a>
                                <button onClick={handleLogout} className="btn btn-danger btn-flat float-end">Keluar</button>
                            </li>
                            {/*end::Menu Footer*/}
                        </ul>
                    </li>
                    {/*end::User Menu Dropdown*/}
                </ul>
                {/* end::End Navbar Links */}
            </div>
            {/* end::Container */}
        </nav>

    );
}
