import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CoursesList from "../CoursesList";

const courses = [
  { _id: "c1", title: "Course One", instructor: { _id: "i1", name: "Instructor One" } },
];

describe("CoursesList", () => {
  it("renders courses and triggers edit/delete", async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <CoursesList
        courses={courses}
        loading={false}
        onRefresh={() => {}}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageCategories={() => {}}
        onManageTheme={() => {}}
      />
    );

    expect(screen.getByText("Course One")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith("c1");

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("c1");
  });
});
