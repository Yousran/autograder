//dir: app/test/[joinCode]/start/page.tsx
import TestQuestion from "@/components/custom/test-question";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet";  

export default function Home() {

    return (
        <div className="flex flex-col justify-between min-h-screen">
            <Sheet>
                <div className="flex justify-between items-center p-4">
                    <div className="flex-1"></div>
                    <h1 className="text-xl font-bold flex-1 text-center">test Title</h1>
                    <div className="flex-1 flex justify-end gap-4">
                        <h4 className="text-xl font-bold text-center">00:00</h4>
                        <SheetTrigger asChild>
                            <Button variant="default">List</Button>
                        </SheetTrigger>
                    </div>
                </div>
                <SheetContent>
                    <SheetHeader>
                    <SheetTitle>Are you absolutely sure?</SheetTitle>
                    <SheetDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </SheetDescription>
                    </SheetHeader>
                </SheetContent>
                <TestQuestion />
                <div className="flex justify-between items-center p-4">
                    <Button variant="default">Prev</Button>
                    <Button variant="default">Mark</Button>
                    <Button variant="default">Next</Button>
                </div>
            </Sheet>
        </div>
    );
  }