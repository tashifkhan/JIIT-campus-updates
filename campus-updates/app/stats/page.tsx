'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UsersIcon, 
  TrendingUpIcon, 
  IndianRupeeIcon,
  BuildingIcon,
  GraduationCapIcon,
  CalendarIcon
} from 'lucide-react';

interface Placement {
  id: string;
  student_name: string;
  roll_number: string;
  company: string;
  job_profile: string;
  package: number;
  placement_date: string;
  course: string;
}

export default function StatsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [showStudentList, setShowStudentList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/placements.json')
      .then(res => res.json())
      .then(data => {
        setPlacements(data);
        setLoading(false);
      });
  }, []);

  const formatPackage = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} LPA`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate statistics
  const totalPlacements = placements.length;
  const packages = placements.map(p => p.package);
  const averagePackage = packages.length > 0 ? packages.reduce((a, b) => a + b, 0) / packages.length : 0;
  const sortedPackages = [...packages].sort((a, b) => a - b);
  const medianPackage = sortedPackages.length > 0 ? 
    sortedPackages.length % 2 === 0 
      ? (sortedPackages[sortedPackages.length / 2 - 1] + sortedPackages[sortedPackages.length / 2]) / 2
      : sortedPackages[Math.floor(sortedPackages.length / 2)]
    : 0;
  
  const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
  const uniqueCompanies = new Set(placements.map(p => p.company)).size;

  // Group placements by company
  const companyStats = placements.reduce((acc, placement) => {
    if (!acc[placement.company]) {
      acc[placement.company] = {
        count: 0,
        profiles: new Set(),
        avgPackage: 0,
        packages: []
      };
    }
    acc[placement.company].count += 1;
    acc[placement.company].profiles.add(placement.job_profile);
    acc[placement.company].packages.push(placement.package);
    return acc;
  }, {} as any);

  // Calculate average packages for companies
  Object.keys(companyStats).forEach(company => {
    const packages = companyStats[company].packages;
    companyStats[company].avgPackage = packages.reduce((a: number, b: number) => a + b, 0) / packages.length;
  });

  if (loading) {
    return (
      <Layout>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Placement Statistics
          </h1>
          <p className="text-gray-600">Campus placement data and analytics</p>
        </div>

        {/* Key Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Placements</p>
                  <p className="text-3xl font-bold text-blue-900">{totalPlacements}</p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Average Package</p>
                  <p className="text-3xl font-bold text-green-900">{formatPackage(averagePackage)}</p>
                </div>
                <TrendingUpIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Median Package</p>
                  <p className="text-3xl font-bold text-purple-900">{formatPackage(medianPackage)}</p>
                </div>
                <IndianRupeeIcon className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Companies</p>
                  <p className="text-3xl font-bold text-orange-900">{uniqueCompanies}</p>
                </div>
                <BuildingIcon className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company-wise Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BuildingIcon className="w-5 h-5 mr-2" />
              Company-wise Placements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(companyStats).map(([company, stats]) => (
                <Card key={company} className="border">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{company}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students Placed:</span>
                        <Badge variant="secondary">{stats.count}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Package:</span>
                        <span className="font-semibold text-green-700">
                          {formatPackage(stats.avgPackage)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Profiles:</span>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(stats.profiles).map((profile: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {profile}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placed Students Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <GraduationCapIcon className="w-5 h-5 mr-2" />
                Placed Students
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowStudentList(!showStudentList)}
              >
                {showStudentList ? 'Hide List' : 'View All Students'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showStudentList ? (
              <div className="space-y-4">
                {placements.map((placement) => (
                  <Card key={placement.id} className="border">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{placement.student_name}</h3>
                          <p className="text-sm text-gray-600">{placement.roll_number}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {placement.course}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{placement.company}</p>
                          <p className="text-sm text-gray-600">{placement.job_profile}</p>
                        </div>
                        <div className="text-right md:text-left">
                          <p className="font-semibold text-green-700 text-lg">
                            {formatPackage(placement.package)}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {formatDate(placement.placement_date)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {totalPlacements} students have been successfully placed
                </p>
                <div className="flex justify-center items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Highest Package</p>
                    <p className="text-green-700 font-bold">{formatPackage(highestPackage)}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Average Package</p>
                    <p className="text-blue-700 font-bold">{formatPackage(averagePackage)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}