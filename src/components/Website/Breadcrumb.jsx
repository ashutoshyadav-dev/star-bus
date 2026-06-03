import { useNavigate } from "react-router-dom";

function Breadcrumb({ title }) {
  const navigate = useNavigate();

  return (
    <div className="px-10 py-3 bg-white shadow-sm">
      <p className="text-sm text-gray-500">
        <span
          onClick={() => navigate("/")}
          className="cursor-pointer hover:text-green-500"
        >
          Home
        </span>
        {" > "}
        <span className="font-medium text-orange-500">
          {title}
        </span>
      </p>
    </div>
  );
}

export default Breadcrumb;