

import { useState, type FormEvent } from "react";

import { useNavigate } from "react-router-dom";

import axios from "axios";

import {

  ArrowRight,

  Eye,

  EyeOff,

  LockKeyhole,

  Mail,

} from "lucide-react";

import api from "../../api/axiosInstance";

import "./Login.css";

type UserType = 1 | 2 | 3;

type LoginUser = {

  userId: string;

  name: string;

  email: string;

  userType: UserType;

  designation?: string;

  jobTitle?: string;

};

type LoginSession = {

  userId: string;

  email: string;

  userType: UserType;

  loginTime: string;

  sessionDate: string;

};

export function Login() {

  const navigate = useNavigate();

  /* =========================================

     FORM STATES

  ========================================= */

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);

  /* =========================================

     CURRENT DATE

  ========================================= */

  const getTodayDate = (): string => {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(

      now.getMonth() + 1

    ).padStart(2, "0");

    const day = String(

      now.getDate()

    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

  };

  /* =========================================

     SAVE LOGIN SESSION

  ========================================= */

  const storeLogin = (user: LoginUser): void => {

    const session: LoginSession = {

      userId: user.userId,

      email: user.email,

      userType: user.userType,

      loginTime: new Date().toISOString(),

      sessionDate: getTodayDate(),

    };

    localStorage.setItem(

      "employeeLoginSession",

      JSON.stringify(session)

    );

    localStorage.setItem(

      "loggedInUser",

      JSON.stringify(user)

    );

  };

  /* =========================================

     ROLE-BASED NAVIGATION

     1 = HR

     2 = Admin

     3 = Employee

  ========================================= */

  const redirectUser = (userType: UserType): void => {

    switch (userType) {

      case 1:

        navigate("/hrdashboard");

        break;

      case 2:

        navigate("/admindashboard");

        break;

      case 3:

        navigate("/employeedashboard");

        break;

      default:

        setLoginError("Invalid user role.");

    }

  };

  /* =========================================

     LOGIN SUBMISSION

  ========================================= */

  const handleSubmit = async (

    event: FormEvent<HTMLFormElement>

  ): Promise<void> => {

    event.preventDefault();

    setEmailError("");

    setPasswordError("");

    setLoginError("");

    let valid = true;

    const cleanEmail = email.trim().toLowerCase();

    /* EMAIL VALIDATION */

    if (!cleanEmail) {

      setEmailError("Email is required");

      valid = false;

    } else if (

      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)

    ) {

      setEmailError("Enter a valid email address");

      valid = false;

    }

    /* PASSWORD VALIDATION */

    if (!password.trim()) {

      setPasswordError("Password is required");

      valid = false;

    }

    if (!valid) {

      return;

    }

    try {

      setLoading(true);

      /* LOGIN API */

      const response = await api.post("/login", {

        email: cleanEmail,

        password: password,

      });

      console.log("Login API response:", response.data);

      /* CHECK RESPONSE */

      if (response.data?.success === false) {

        throw new Error(

          response.data?.message || "Login failed"

        );

      }

      /* GET EMPLOYEE DATA */

      const backendUser =

        response.data?.data?.employee;

      if (!backendUser) {

        throw new Error("User data not found");

      }

      /* USER ROLE */

      const userType = Number(

        backendUser.userType

      ) as UserType;

      if (

        userType !== 1 &&

        userType !== 2 &&

        userType !== 3

      ) {

        throw new Error("Invalid user role");

      }

      /* USER ID */

      const userId =

        backendUser.employeeId ??

        backendUser.employeeMongoId ??

        backendUser.id ??

        backendUser._id;

      if (!userId) {

        throw new Error("User ID not found");

      }

      /* CREATE LOGGED-IN USER */

      const user: LoginUser = {

        userId: String(userId),

        name:

          backendUser.name ??

          cleanEmail,

        email:

          backendUser.email ??

          cleanEmail,

        userType,

        designation:

          typeof backendUser.designation === "string"

            ? backendUser.designation.trim()

            : "",

        jobTitle:

          typeof backendUser.jobTitle === "string"

            ? backendUser.jobTitle.trim()

            : "",

      };

      /* STORE AUTH TOKEN */

      const token = response.data?.data?.token;

      if (token) {

        localStorage.setItem("token", token);

      }

      /* STORE USER AND SESSION */

      storeLogin(user);

      console.log("Logged in user:", user);

      console.log("User type:", userType);

      /* NAVIGATE */

      redirectUser(userType);

    } catch (error: unknown) {

      console.error("Login error:", error);

      if (axios.isAxiosError(error)) {

        console.log("Status:", error.response?.status);

        console.log(

          "Backend response:",

          error.response?.data

        );

        setLoginError(

          error.response?.data?.message ||

            "Invalid email or password."

        );

      } else if (error instanceof Error) {

        setLoginError(error.message);

      } else {

        setLoginError(

          "Unable to login. Please try again."

        );

      }

    } finally {

      setLoading(false);

    }

  };

  /* =========================================

     LOGIN PAGE UI

  ========================================= */

  return (

    <div className="login-page">

      {/* =====================================

          LEFT SIDE — TEAM ILLUSTRATION

      ===================================== */}

      <aside

        className="login-visual-panel"

        aria-label="Tech Leafe team illustration"

      >

        <div className="login-visual-content">

          <img

            src="/Team.png"

            alt="Tech Leafe employees working together in an office"

            className="login-team-image"

          />

        </div>

      </aside>

      {/* =====================================

          RIGHT SIDE — LOGIN FORM

      ===================================== */}

      <main className="login-panel">

        <div className="login-container">

          {/* COMPANY LOGO */}

          <div className="login-logo">

            <img

              src="/hrms logo.png"

              alt="Tech Leafe Technologies"

            />

          </div>

          {/* LOGIN HEADING */}

          <div className="login-heading">

            <h1>Enter Workspace</h1>

            <p>

              Enter your email and password

              to continue.

            </p>

          </div>

          {/* GLOBAL LOGIN ERROR */}

          {loginError && (

            <div

              className="login-error-message login-global-error"

              role="alert"

            >

              {loginError}

            </div>

          )}

          {/* LOGIN FORM */}

          <form

            className="login-form"

            onSubmit={handleSubmit}

            noValidate

          >

            {/* EMAIL */}

            <div className="login-form-group">

              <label htmlFor="email">

                Email ID

              </label>

              <div

                className={`login-input-box ${

                  emailError ? "login-input-error" : ""

                }`}

              >

                <Mail

                  size={20}

                  className="login-input-icon"

                />

                <input

                  id="email"

                  name="email"

                  type="email"

                  autoComplete="username"

                  placeholder="name@techleafe.com"

                  value={email}

                  aria-invalid={!!emailError}

                  onChange={(event) => {

                    setEmail(event.target.value);

                    setEmailError("");

                    setLoginError("");

                  }}

                />

              </div>

              {emailError && (

                <span

                  className="login-error-message"

                  role="alert"

                >

                  {emailError}

                </span>

              )}

            </div>

            {/* PASSWORD */}

            <div className="login-form-group">

              <label htmlFor="password">

                Password

              </label>

              <div

                className={`login-input-box ${

                  passwordError ? "login-input-error" : ""

                }`}

              >

                <LockKeyhole

                  size={20}

                  className="login-input-icon"

                />

                <input

                  id="password"

                  name="password"

                  type={

                    showPassword ? "text" : "password"

                  }

                  autoComplete="current-password"

                  placeholder="Enter your password"

                  value={password}

                  aria-invalid={!!passwordError}

                  onChange={(event) => {

                    setPassword(event.target.value);

                    setPasswordError("");

                    setLoginError("");

                  }}

                />

                <button

                  type="button"

                  className="login-eye-button"

                  onClick={() =>

                    setShowPassword((current) => !current)

                  }

                  aria-label={

                    showPassword

                      ? "Hide password"

                      : "Show password"

                  }

                >

                  {showPassword ? (

                    <EyeOff size={20} />

                  ) : (

                    <Eye size={20} />

                  )}

                </button>

              </div>

              {passwordError && (

                <span

                  className="login-error-message"

                  role="alert"

                >

                  {passwordError}

                </span>

              )}

            </div>

            {/* LOGIN BUTTON */}

            <button

              type="submit"

              className="login-submit-button"

              disabled={loading}

            >

              <span>

                {loading ? "Logging in..." : "Login"}

              </span>

              {!loading && (

                <ArrowRight size={21} />

              )}

            </button>

          </form>

          {/* AUTHORIZATION TEXT */}

          <p className="login-authorized">

            Authorized Tech Leafe employees only.

          </p>

        </div>

      </main>

    </div>

  );

}

export default Login;
