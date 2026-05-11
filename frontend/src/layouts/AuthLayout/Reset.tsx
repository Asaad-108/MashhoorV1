import { Link } from "react-router-dom";
import { Title } from "../../components";

function Reset() {
  return (
    <div className="login-bg flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex justify-center items-center flex-col text-center">
        <Link to="/">
          <Title />
        </Link>
        <div className="text-gray-500 text-lg mt-2">
          Reset your password to regain access
        </div>
      </div>

      <div className="login-card rounded-2xl p-8 w-full max-w-120">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Reset your password
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <img
                src="/src/assets/mail.svg"
                alt="Email"
                width={18}
                height={18}
              />
            </div>
            <input
              type="email"
              placeholder="Enter your email"
              className="login-input w-full rounded-lg py-3 pl-10 pr-4 text-gray-900"
            />
          </div>
        </div>

        <button className="btn-reset mb-6">Send Reset Link</button>

        <Link to={"/login"} className="back-link cursor-pointer">
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default Reset;
