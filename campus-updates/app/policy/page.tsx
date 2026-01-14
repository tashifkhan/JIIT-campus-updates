import PolicyClient from "@/components/policy/PolicyClient";

export const metadata = {
	title: "Placement Policy",
	description: "Jaypee Universities Placement Policy (2026 Graduating Batches)",
};

export default function PolicyPage() {
	return (
		<>
			<div className="max-w-7xl mx-auto">
				<PolicyClient>
					<p>
						This policy consolidates updates from February 8, 2025, April 13,
						2025, and August 8, 2025.
					</p>

					<h2 id="general-placement-drive-rules">
						I. General Placement Drive Rules (Effective June 1, 2026 onwards)
					</h2>
					<ul>
						<li>
							<strong>Eligibility:</strong> Placement drives will <em>only</em>{" "}
							be conducted for students who are currently unplaced.
						</li>
						<li>
							<strong>Ineligibility Criteria:</strong> You will <em>not</em> be
							eligible for these drives if you:
							<ul>
								<li>
									Have been terminated (&quot;sacked&quot;) by a company due to
									indiscipline or poor performance.
								</li>
								<li>Have previously rejected a placement offer.</li>
							</ul>
						</li>
					</ul>

					<h2 id="internship-policy">
						II. Internship Policy and its Impact on Placements
					</h2>
					<p>
						This section differentiates between types of internships and their
						consequences for campus placement.
					</p>

					<h3>
						A. Students on &quot;Internship Only&quot; (Selected through Campus Only, from
						June 2025 onwards)
					</h3>
					<p>
						These are students who have secured an internship but{" "}
						<strong>not</strong> an accompanying full-time role (PPO) or a
						guaranteed full-time role based on performance.
					</p>
					<ul>
						<li>
							<strong>Participation in Drives:</strong> You are permitted to
							participate in mass recruitment drives <em>until</em> you secure
							your first full-time offer.
						</li>
						<li>
							<strong>
								Eligibility for Virtual Future Drives (with specific joining
								dates):
							</strong>
							<ul>
								<li>
									<strong>One-year internship:</strong> Eligible for
									participation in virtual drives where the date of joining is{" "}
									<strong>after June 2026</strong>.
								</li>
								<li>
									<strong>Six-months internship:</strong> Eligible for
									participation in virtual drives where the date of joining is{" "}
									<strong>after January 2026</strong>.
								</li>
							</ul>
						</li>
					</ul>

					<h3>
						B. Students on &quot;Internship with Full-time Role&quot; or
						&quot;Full-time Role Based on Performance During Internship&quot;
						(From June 2025 onwards)
					</h3>
					<p>
						These are students who have secured an internship that{" "}
						<em>includes</em> a full-time role offer or a full-time role
						contingent on their performance during the internship.
					</p>
					<ul>
						<li>
							<strong>Placement Status:</strong> If you fall into this category,
							you will be considered{" "}
							<strong>out of the campus placement process</strong> immediately.
							This means you cannot participate in any further campus placement
							drives.
						</li>
					</ul>

					<h3>C. Mandatory Internship Completion and Conduct</h3>
					<ul>
						<li>
							All students are required to complete their internship period
							while maintaining strict discipline and decorum at the
							workplace/organization.
						</li>
						<li>
							<strong>Withdrawal Penalty:</strong> If you join a campus
							recruitment company for an internship with a full-time role and
							subsequently withdraw (before, after, or in-between the
							internship), you will <strong>not be permitted</strong> to
							participate in <em>any</em> future placement drives.
						</li>
					</ul>

					<h2 id="package-level-and-offer-management">
						III. Package Level and Offer Management
					</h2>
					<p>
						This outlines the rules for accepting offers and participating in
						drives based on your current package level.
					</p>
					<h3>A. Compulsory Participation for Unplaced Students</h3>
					<ul>
						<li>
							It is mandatory for all unplaced students to participate in all
							mass recruitment drives until they receive their first offer.
						</li>
					</ul>
					<h3>B. Impact of First Offer on Future Drives</h3>
					<ul>
						<li>
							<strong>Offer of ₹4.60 Lacs or below:</strong> Securing an offer
							in this range <strong>will not restrict</strong> your chances of
							sitting for higher package drives.
						</li>
						<li>
							<strong>Offer in a higher package:</strong> If you have already
							secured an offer in a higher package bracket, you will{" "}
							<strong>not be permitted</strong> to participate in lower package
							drives.
						</li>
					</ul>
					<h3>C. Multiple Offers</h3>
					<ul>
						<li>
							If you receive multiple offers, you will be asked to choose one.
							This choice includes the option of an internship (if applicable)
							for joining from January 2026 onwards or direct on-boarding from
							June 2026 onwards.
						</li>
					</ul>
					<h3>D. Package Level Eligibility for Placement Drives</h3>
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr>
									<th className="text-left p-2">Package Level</th>
									<th className="text-left p-2">
										Highest Offered Package (Lacs, including PPO)
									</th>
									<th className="text-left p-2">
										Eligibility for Next Level Drives
									</th>
									<th className="text-left p-2">Remarks</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className="align-top p-2">
										<strong>Level I</strong>
									</td>
									<td className="align-top p-2">Up to ₹8 Lacs</td>
									<td className="align-top p-2">
										<p className="mb-2">
											<strong>If your current offer is:</strong>
										</p>
										<ul>
											<li>
												₹4.60 Lacs or below: You are permitted to sit in drives
												for packages of ₹6.00 Lacs and above.
											</li>
											<li>
												Above ₹4.60 Lacs: You are permitted to sit in drives for
												the <strong>next level</strong> (Level II) with a
												package at least two times higher than your current
												offer.
											</li>
										</ul>
									</td>
									<td className="align-top p-2">
										<ul>
											<li>
												Your participation in Level I drives is also based on
												specific eligibility criteria provided by the recruiting
												company.
											</li>
											<li>
												<strong>
													You can only hold one offer at a single package level.
												</strong>{" "}
												If you receive another offer at the same level, you must
												choose.
											</li>
										</ul>
									</td>
								</tr>
								<tr>
									<td className="align-top p-2">
										<strong>Level II</strong>
									</td>
									<td className="align-top p-2">Above ₹8 Lacs to ₹16 Lacs</td>
									<td className="align-top p-2">
										You are permitted to sit in drives for the{" "}
										<strong>next level</strong> (Level III) if the package is at
										least two times higher than your existing offer.
									</td>
									<td className="align-top p-2">
										<strong>
											You can only hold one offer at a single package level.
										</strong>
									</td>
								</tr>
								<tr>
									<td className="align-top p-2">
										<strong>Level III</strong>
									</td>
									<td className="align-top p-2">Above ₹16 Lacs</td>
									<td className="align-top p-2">
										No further upgrade drives permitted on campus.
									</td>
									<td className="align-top p-2">
										<strong>
											You can only hold one offer at a single package level.
										</strong>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<h2 id="provisions-jan-2026">IV. Provisions from January 1, 2026</h2>
					<ul>
						<li>
							<strong>Placed Students (with one offer only):</strong> If you
							have a single offer in a regular semester, with a joining date
							from June 2026 onwards, you are allowed to participate in drives
							to <strong>upgrade your package</strong> <em>until</em> you secure
							one more offer.
						</li>
						<li>
							<strong>Unplaced Students:</strong> You are eligible to
							participate in <strong>all</strong> placement drives. Once you
							secure an offer, you will be given{" "}
							<strong>one opportunity</strong> to upgrade your package as per
							the policy.
						</li>
					</ul>

					<h2 id="modes-of-joining">V. Modes of Joining the Company</h2>
					<p>
						This details the different scenarios for joining a company, often
						involving an internship first. Academic management during
						internships will be coordinated through respective HoDs.
					</p>
					<ul>
						<li>
							<strong>(a) One-year internship:</strong> From June 2025 onwards,
							with or without a full-time role based on performance.
						</li>
						<li>
							<strong>(b) Six-months internship:</strong> From June 2025 /
							January 2026 onwards, with a full-time role or extension of
							internship with a full-time role based on performance.
						</li>
						<li>
							<strong>(c) Direct Joining:</strong> From June 2026 onwards, with
							or without an internship / full-time role based on performance
							during an internship.
						</li>
					</ul>

					<h2 id="business-development-roles">
						VI. Business Development Roles
					</h2>
					<ul>
						<li>
							Students who receive offer(s) for business development roles are
							eligible for package up-gradation, following the general placement
							policy.
						</li>
					</ul>

					<h2 id="off-campus-offers">VII. Off-Campus Offers</h2>
					<p>
						Students with off-campus offers <em>may</em> be permitted to join an
						&quot;Internship with Full-time Role&quot; or &quot;Full-time Role
						Based on Performance&quot; for 6 months from January 1, 2026
						onwards, subject to specific conditions:
					</p>
					<ul>
						<li>
							<strong>A. Documentation Required:</strong> The company&apos;s HR
							must email the Head T&P with an official offer letter (on company
							letterhead) detailing:
							<ul>
								<li>Start and end dates of the internship.</li>
								<li>Stipend during the internship.</li>
								<li>The package for the full-time role.</li>
							</ul>
						</li>
						<li>
							<strong>B. Performance Assessment:</strong> After the internship
							concludes, or by May 20, 2026 (whichever is earlier), the company
							must share the student&apos;s performance assessment by May 25,
							2026, for inclusion in the final degree marks.
						</li>
						<li>
							<strong>C. Campus Placement Status:</strong>{" "}
							<strong>
								Once your off-campus offer case is approved, you will be out of
								the campus placement process.
							</strong>
						</li>
					</ul>

					<h2 id="miscellaneous">VIII. Miscellaneous</h2>
					<ul>
						<li>
							<strong>Disciplinary Guidelines:</strong> Separate disciplinary
							guidelines are attached for students participating in placement
							drives, which you must comply with. (The document mentions a PDF
							attachment for this).
						</li>
						<li>
							<strong>Interaction:</strong> Brigadier Sanjay Dawar will be
							interacting with students during March/April 2025.
						</li>
					</ul>

					<h2 id="key-takeaways">Key Takeaways and Potential Questions</h2>
					<ul>
						<li>
							<strong>Understand your internship status:</strong> The
							distinction between &quot;internship only&quot; and
							&quot;internship with full-time role&quot; is crucial. If you
							secure a PPO or a performance-based full-time role with your
							internship, you&apos;re out of campus placements.
						</li>
						<li>
							<strong>Strategic Participation:</strong> If you have an offer
							below ₹4.60 Lacs, you still have broad access to higher package
							drives. If your offer is higher, your options to re-sit are more
							restricted to significantly higher packages (2x current).
						</li>
						<li>
							<strong>One Offer per Level:</strong> Be mindful that you can only
							hold one offer at a specific package level. This implies careful
							decision-making if you get multiple offers within the same band.
						</li>
						<li>
							<strong>Off-Campus Offers:</strong> While possible, getting an
							off-campus offer approved means you exit the campus placement
							process entirely. This is a significant commitment.
						</li>
						<li>
							<strong>Dates are Important:</strong> Pay close attention to dates
							like June 2025, January 2026, June 2026, and May 2026/May 25,
							2026.
						</li>
					</ul>
				</PolicyClient>
			</div>
		</>
	);
}
