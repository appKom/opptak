import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { RowType } from "../../components/Table";
import { useRouter } from "next/router";
import LoadingPage from "../../components/LoadingPage";

export default function ConfirmInterviews() {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [periods, setPeriods] = useState<RowType[]>([]);

  // Show loading while checking session or redirecting
  if (status === "loading") {
    return <LoadingPage />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold mb-4">Bekreft intervjuer</h1>
        <p className="text-lg text-gray-600 mb-8">
          Du må være logget inn for å se denne siden.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Bekreft intervjuer</h1>
      <p className="text-lg text-gray-600 mb-8">
        Her kan du bekrefte intervjutider for søkere.
      </p>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6"></div>
    </div>
  );
}
