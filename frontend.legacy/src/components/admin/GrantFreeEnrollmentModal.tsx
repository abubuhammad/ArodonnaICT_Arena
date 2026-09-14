// src/components/admin/GrantFreeEnrollmentModal.tsx
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
interface GrantFreeEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrant: () => Promise<void>;
  enrollmentUserName: string;
}

const GrantFreeEnrollmentModal: React.FC<GrantFreeEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onGrant,
  enrollmentUserName,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Grant Free Enrollment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to grant {enrollmentUserName} free access to this paid course?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onGrant}>Grant Access</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GrantFreeEnrollmentModal;
