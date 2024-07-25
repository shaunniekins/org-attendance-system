import Redirect from "@/utils/Redirect";
import SigninComponent from "../components/Signin";

export default async function Signin() {
  return (
    <Redirect>
      <SigninComponent />
    </Redirect>
  );
}
