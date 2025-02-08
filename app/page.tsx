//TODO: login
//TODO: logout
//TODO: profile page
//TODO: auth ui
//TODO: api auth middleware
//TODO: create test

//TODO: edit test
//TODO: share join code and QR code
//TODO: join test
//TODO: working test
//TODO: test result
//TODO: edit test result
//TODO: optional test duration using alarm input
//TODO: edit profile
//TODO: login with google
import Navbar from "@/components/custom/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full sm:w-2/5">
          <CardContent className="flex flex-col gap-4 p-4">
            <Input placeholder="Enter your join code" />
            <div className="flex justify-between gap-4">
              <Button variant={"secondary"} className="w-full">Join with QR</Button>
              <Button variant={"default"} className="w-full">Join</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}