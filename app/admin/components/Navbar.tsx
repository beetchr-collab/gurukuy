"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Navbar() {
    const { user } = useAuth();
    const router = useRouter();

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
        await signOut(auth);
        router.push("/login");

        // 🔥 auto close sidebar di mobile saat klik menu
        const closeSidebarMobile = () => {
            if (window.innerWidth < 992) {
                document.body.classList.remove("sidebar-open");
                document.body.classList.remove("sidebar-collapse");
            }
        }
    };

    return (
        <nav className="app-header navbar navbar-expand bg-secondary-subtle" data-bs-theme="light">
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
                    {/*begin::Messages Dropdown Menu*/}
                    <li className="nav-item dropdown">
                        <a className="nav-link" data-bs-toggle="dropdown" href="#">
                            <i className="bi bi-chat-text"></i>
                            <span className="navbar-badge badge text-bg-danger">3</span>
                        </a>
                        <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                            <a href="#" className="dropdown-item">
                                {/*begin::Message*/}
                                <div className="d-flex">
                                    <div className="flex-shrink-0">
                                        <img
                                            src="./assets/img/user1-128x128.jpg"
                                            alt="User Avatar"
                                            className="img-size-50 rounded-circle me-3"
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h3 className="dropdown-item-title">
                                            Brad Diesel
                                            <span className="float-end fs-7 text-danger"
                                            ><i className="bi bi-star-fill"></i
                                            ></span>
                                        </h3>
                                        <p className="fs-7">Call me whenever you can...</p>
                                        <p className="fs-7 text-secondary">
                                            <i className="bi bi-clock-fill me-1"></i> 4 Hours Ago
                                        </p>
                                    </div>
                                </div>
                                {/*end::Message*/}
                            </a>
                            <div className="dropdown-divider"></div>
                            <a href="#" className="dropdown-item">
                                {/*begin::Message*/}
                                <div className="d-flex">
                                    <div className="flex-shrink-0">
                                        <img
                                            src="./assets/img/user8-128x128.jpg"
                                            alt="User Avatar"
                                            className="img-size-50 rounded-circle me-3"
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h3 className="dropdown-item-title">
                                            John Pierce
                                            <span className="float-end fs-7 text-secondary">
                                                <i className="bi bi-star-fill"></i>
                                            </span>
                                        </h3>
                                        <p className="fs-7">I got your message bro</p>
                                        <p className="fs-7 text-secondary">
                                            <i className="bi bi-clock-fill me-1"></i> 4 Hours Ago
                                        </p>
                                    </div>
                                </div>
                                {/*end::Message*/}
                            </a>
                            <div className="dropdown-divider"></div>
                            <a href="#" className="dropdown-item">
                                {/*begin::Message*/}
                                <div className="d-flex">
                                    <div className="flex-shrink-0">
                                        <img
                                            src="./assets/img/user3-128x128.jpg"
                                            alt="User Avatar"
                                            className="img-size-50 rounded-circle me-3"
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <h3 className="dropdown-item-title">
                                            Nora Silvester
                                            <span className="float-end fs-7 text-warning">
                                                <i className="bi bi-star-fill"></i>
                                            </span>
                                        </h3>
                                        <p className="fs-7">The subject goes here</p>
                                        <p className="fs-7 text-secondary">
                                            <i className="bi bi-clock-fill me-1"></i> 4 Hours Ago
                                        </p>
                                    </div>
                                </div>
                                {/* end::Message */}
                            </a>
                            <div className="dropdown-divider"></div>
                            <a href="#" className="dropdown-item dropdown-footer">See All Messages</a>
                        </div>
                    </li>
                    {/*end::Messages Dropdown Menu*/}

                    {/*begin::Notifications Dropdown Menu*/}
                    <li className="nav-item dropdown">
                        <a className="nav-link" data-bs-toggle="dropdown" href="#">
                            <i className="bi bi-bell-fill"></i>
                            <span className="navbar-badge badge text-bg-warning">15</span>
                        </a>
                        <div className="dropdown-menu dropdown-menu-lg dropdown-menu-end">
                            <span className="dropdown-item dropdown-header">15 Notifications</span>
                            <div className="dropdown-divider"></div>
                            <a href="#" className="dropdown-item">
                                <i className="bi bi-envelope me-2"></i> 4 new messages
                                <span className="float-end text-secondary fs-7">3 mins</span>
                            </a>
                            <div className="dropdown-divider"></div>
                            <a href="#" className="dropdown-item">
                                <i className="bi bi-people-fill me-2"></i> 8 friend requests
                                <span className="float-end text-secondary fs-7">12 hours</span>
                            </a>
                            <div className="dropdown-divider"></div>
                            <a href="#" className="dropdown-item">
                                <i className="bi bi-file-earmark-fill me-2"></i> 3 new reports
                                <span className="float-end text-secondary fs-7">2 days</span>
                            </a>
                            <div className="dropdown-divider"></div>
                            <a href="#" className="dropdown-item dropdown-footer"> See All Notifications </a>
                        </div>
                    </li>
                    {/*end::Notifications Dropdown Menu*/}

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
