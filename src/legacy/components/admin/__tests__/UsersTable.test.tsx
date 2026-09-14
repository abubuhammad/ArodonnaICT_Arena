import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UsersTable from "../UsersTable";

const users = [
  { _id: "1", name: "Alice", email: "alice@example.com", role: "student" },
  { _id: "2", name: "Bob", email: "bob@example.com", role: "pending" },
];

describe("UsersTable", () => {
  it("renders rows and triggers delete", async () => {
    const onDelete = jest.fn();
    render(
      <UsersTable
        users={users}
        loading={false}
        searchTerm=""
        onSearchChange={() => {}}
        onRefresh={() => {}}
        onDelete={onDelete}
        onApprove={() => {}}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    expect(onDelete).toHaveBeenCalled();
  });

  it("calls approve for pending instructor", async () => {
    const onApprove = jest.fn();
    render(
      <UsersTable
        users={users}
        loading={false}
        searchTerm=""
        onSearchChange={() => {}}
        onRefresh={() => {}}
        onDelete={() => {}}
        onApprove={onApprove}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /approve/i }));
    expect(onApprove).toHaveBeenCalledWith("2");
  });
});
