'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BuildingIcon, 
  CalendarIcon, 
  IndianRupeeIcon, 
  MapPinIcon,
  UsersIcon,
  BookOpenIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from 'lucide-react';

interface Job {
  id: string;
  job_profile: string;
  company: string;
  placement_category_code: number;
  placement_category: string;
  createdAt: number;
  deadline: number;
  eligibility_marks: Array<{
    level: string;
    criteria: number;
  }>;
  eligibility_courses: string[];
  allowed_genders: string[];
  job_description: string;
  location: string;
  package: number;
  package_info: string;
  required_skills: string[];
  hiring_flow: string[];
  placement_type: string | null;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/jobs.json')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPackage = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} LPA`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getCategoryColor = (code: number) => {
    switch (code) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      case 4: return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Job Opportunities
          </h1>
          <p className="text-gray-600">Explore campus placement opportunities</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {job.job_profile}
                    </CardTitle>
                    <div className="flex items-center text-gray-600 mb-2">
                      <BuildingIcon className="w-4 h-4 mr-1" />
                      <span className="font-medium">{job.company}</span>
                    </div>
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={getCategoryColor(job.placement_category_code)}
                >
                  {job.placement_category}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <IndianRupeeIcon className="w-4 h-4 mr-1 text-green-600" />
                    <span className="font-semibold text-green-700">
                      {formatPackage(job.package)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    <span>{job.location}</span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-red-600">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span>Deadline: {formatDate(job.deadline)}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  className="w-full"
                >
                  {expandedJob === job.id ? (
                    <>Less Details <ChevronUpIcon className="w-4 h-4 ml-1" /></>
                  ) : (
                    <>More Details <ChevronDownIcon className="w-4 h-4 ml-1" /></>
                  )}
                </Button>

                {expandedJob === job.id && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <BookOpenIcon className="w-4 h-4 mr-1" />
                        Job Description
                      </h4>
                      <div 
                        className="text-sm text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: job.job_description }}
                      />
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Eligibility Marks</h4>
                      <div className="space-y-1">
                        {job.eligibility_marks.map((mark, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{mark.level}:</span>
                            <span className="font-medium">{mark.criteria}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Eligible Courses</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.eligibility_courses.map((course, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {job.required_skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {job.required_skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Hiring Process</h4>
                      <div className="space-y-2">
                        {job.hiring_flow.map((step, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center mr-3">
                              {idx + 1}
                            </div>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {job.package_info && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Package Info</h4>
                        <p className="text-sm text-gray-700">{job.package_info}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}