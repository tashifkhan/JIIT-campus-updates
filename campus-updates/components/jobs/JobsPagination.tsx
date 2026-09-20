"use client";

import { Fragment } from "react";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
};

export default function JobsPagination({ page, totalPages, onPageChange }: Props) {
	if (totalPages <= 1) return null;

	const pages = Array.from(new Set([1, totalPages, page - 1, page, page + 1]))
		.filter((value) => value >= 1 && value <= totalPages)
		.sort((left, right) => left - right);

	return (
		<Pagination className="mt-8">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(event) => {
							event.preventDefault();
							if (page > 1) onPageChange(page - 1);
						}}
						aria-disabled={page === 1}
						className={
							page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
						}
					/>
				</PaginationItem>

				{pages.map((pageNumber, index) => {
					const previousPage = pages[index - 1];
					return (
						<Fragment key={pageNumber}>
							{previousPage && pageNumber - previousPage > 1 ? (
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
							) : null}
							<PaginationItem>
								<PaginationLink
									href="#"
									onClick={(event) => {
										event.preventDefault();
										onPageChange(pageNumber);
									}}
									isActive={page === pageNumber}
									className="cursor-pointer"
								>
									{pageNumber}
								</PaginationLink>
							</PaginationItem>
						</Fragment>
					);
				})}

				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={(event) => {
							event.preventDefault();
							if (page < totalPages) onPageChange(page + 1);
						}}
						aria-disabled={page === totalPages}
						className={
							page === totalPages
								? "pointer-events-none opacity-50"
								: "cursor-pointer"
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
