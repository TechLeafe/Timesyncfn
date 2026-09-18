import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const [loading, setLoading] = useState(false);

  /* =========================================
     TODAY DATE
  ========================================= */

  const getTodayDate = () => {
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
     CHECK IF CURRENT WORK SESSION IS OVER

     Working hours:
     09:30 AM - 06:30 PM
  ========================================= */

  const isWorkingSessionCompleted = () => {
    const now = new Date();

    const sessionEnd = new Date();

    sessionEnd.setHours(
      18,
      30,
      0,
      0
    );

    return now >= sessionEnd;
  };

  /* =========================================
     CHECK EXISTING LOGIN
  ========================================= */

  const alreadyLoggedIn = (
    userId: string
  ) => {
    const storedSession =
      localStorage.getItem(
        "employeeLoginSession"
      );

    if (!storedSession) {
      return false;
    }

    try {
      const session: LoginSession =
        JSON.parse(storedSession);

      const today = getTodayDate();

      /*
        Previous day's login should
        never block today's login.
      */

      if (
        session.sessionDate !== today
      ) {
        localStorage.removeItem(
          "employeeLoginSession"
        );

        return false;
      }

      /*
        After 6:30 PM,
        current work session is completed.

        Remove the old session so another
        login can happen.
      */

      if (
        isWorkingSessionCompleted()
      ) {
        localStorage.removeItem(
          "employeeLoginSession"
        );

        return false;
      }

      /*
        Same user already logged in today
        and working session is still active.
      */

      if (
        session.userId === userId
      ) {
        return true;
      }

      return false;
    } catch {
      localStorage.removeItem(
        "employeeLoginSession"
      );

      return false;
    }
  };

  /* =========================================
     STORE LOGIN
  ========================================= */

  const storeLogin = (
    user: LoginUser
  ) => {
    const session: LoginSession = {
      userId: user.userId,

      email: user.email,

      userType: user.userType,

      loginTime:
        new Date().toISOString(),

      sessionDate:
        getTodayDate(),
    };

    /*
      Login record
    */

    localStorage.setItem(
      "employeeLoginSession",
      JSON.stringify(session)
    );

    /*
      Current logged-in user
    */

    localStorage.setItem(
      "loggedInUser",
      JSON.stringify(user)
    );
  };

  /* =========================================
     ROLE BASED NAVIGATION
  ========================================= */

  const redirectUser = (
    userType: UserType
  ) => {
    switch (userType) {
      /*
        1 = HR
      */

      case 1:
        navigate("/hrdashboard");
        break;

      /*
        2 = Admin
      */

      case 2:
        navigate("/admindashboard");
        break;

      /*
        3 = Employee
      */

      case 3:
        navigate(
          "/employeedashboard"
        );
        break;

      default:
        setLoginError(
          "Invalid user role."
        );
    }
  };

  /* =========================================
     FORM SUBMIT
  ========================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    let valid = true;

    setEmailError("");
    setPasswordError("");
    setLoginError("");

    const cleanEmail =
      email.trim();

    /* EMAIL */

    if (!cleanEmail) {
      setEmailError(
        "Email is required"
      );

      valid = false;
    }

    /* PASSWORD */

    if (!password.trim()) {
      setPasswordError(
        "Password is required"
      );

      valid = false;
    }

    if (!valid) {
      return;
    }

    try {
      setLoading(true);

      // /*
      //   =====================================
      //   TEMPORARY FRONTEND USER RESPONSE
      //   =====================================

      //   Later your backend response will
      //   replace this section.

      //   1 = HR
      //   2 = Admin
      //   3 = Employee
      // */

      // let user: LoginUser;

      // if (
      //   cleanEmail ===
      //   "hr@techleafe.com"
      // ) {
      //   user = {
      //     userId: "HR001",
      //     name: "HR User",
      //     email: cleanEmail,
      //     userType: 1,
      //   };
      // } else if (
      //   cleanEmail ===
      //   "admin@techleafe.com"
      // ) {
      //   user = {
      //     userId: "ADMIN001",
      //     name: "Admin User",
      //     email: cleanEmail,
      //     userType: 2,
      //   };
      // } else {
      //   user = {
      //     userId: "EMP001",
      //     name: "Employee User",
      //     email: cleanEmail,
      //     userType: 3,
      //   };
      // }
      /*
  LOGIN API
*/

const response = await api.post("/login", {
  employeeId: cleanEmail,
  password: password,
});

console.log("Login API response:", response.data);

const backendUser =
  response.data.user ??
  response.data.data?.user ??
  response.data.data ??
  response.data;

let userType: UserType;

if (backendUser.userType) {
  userType = Number(backendUser.userType) as UserType;
} else {
  const role = String(backendUser.role ?? "").toLowerCase();

  if (role === "hr") {
    userType = 1;
  } else if (role === "admin") {
    userType = 2;
  } else if (role === "employee") {
    userType = 3;
  } else {
    throw new Error("Invalid user role");
  }
}

const user: LoginUser = {
  userId:
    backendUser.userId ??
    backendUser._id ??
    backendUser.id,
  name:
    backendUser.name ??
    backendUser.fullName ??
    backendUser.email,
  email:
    backendUser.email ??
    cleanEmail,
  userType,
};

/*
  SAVE TOKEN IF BACKEND RETURNS TOKEN
*/

const token =
  response.data.token ??
  response.data.accessToken ??
  response.data.data?.token;

if (token) {
  localStorage.setItem("token", token);
}

      /*
        CHECK WHETHER USER
        ALREADY LOGGED IN
      */

      if (
        alreadyLoggedIn(
          user.userId
        )
      ) {
        setLoginError(
          "You have already logged in for today's working session."
        );

        return;
      }

      /*
        SAVE FIRST LOGIN
      */

      storeLogin(user);

      /*
        REDIRECT BASED ON ROLE
      */

      redirectUser(
        user.userType
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setLoginError(
        "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Logo */}

        <div className="login-logo">
          <img
            src="/techleafelogo.png"
            alt="Tech Leafe Technologies"
          />
        </div>

        {/* Heading */}

        <div className="login-heading">
          <h1>Login</h1>

          <p>
            Enter your email and password
            to continue.
          </p>
        </div>

        {/* Main login error */}

        {loginError && (
          <div className="login-error-message">
            {loginError}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* Email */}

          <div className="login-form-group">

            <label htmlFor="email">
              Email ID
            </label>

            <div
              className={`login-input-box ${
                emailError
                  ? "login-input-error"
                  : ""
              }`}
            >
              <Mail
                size={21}
                className="login-input-icon"
              />

              <input
                id="email"
                type="email"
                placeholder="name@techleafe.com"
                value={email}
                onChange={(event) => {
                  setEmail(
                    event.target.value
                  );

                  setEmailError("");
                  setLoginError("");
                }}
              />
            </div>

            {emailError && (
              <span className="login-error-message">
                {emailError}
              </span>
            )}
          </div>

          {/* Password */}

          <div className="login-form-group">

            <label htmlFor="password">
              Password
            </label>

            <div
              className={`login-input-box ${
                passwordError
                  ? "login-input-error"
                  : ""
              }`}
            >
              <LockKeyhole
                size={21}
                className="login-input-icon"
              />

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  setPasswordError("");
                  setLoginError("");
                }}
              />

              <button
                type="button"
                className="login-eye-button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={21} />
                ) : (
                  <Eye size={21} />
                )}
              </button>
            </div>

            {passwordError && (
              <span className="login-error-message">
                {passwordError}
              </span>
            )}
          </div>

          {/* Login Button */}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            <span>
              {loading
                ? "Logging in..."
                : "Login"}
            </span>

            {!loading && (
              <ArrowRight
                size={23}
              />
            )}
          </button>
        </form>

        <p className="login-authorized">
          Authorized Tech Leafe
          employees only.
        </p>
      </div>
    </div>
  );
}