'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLinkIcon,
  CalendarIcon,
  UsersIcon,
  GlobeIcon,
  CompassIcon
} from 'lucide-react';

interface Society {
  id: string;
  name: string;
  description: string;
  website: string;
  category: string;
}

const categoryColors = {
  Technical: 'bg-blue-100 text-blue-800 border-blue-200',
  Cultural: 'bg-purple-100 text-purple-800 border-purple-200',
  Sports: 'bg-green-100 text-green-800 border-green-200',
  Business: 'bg-orange-100 text-orange-800 border-orange-200',
  Literary: 'bg-pink-100 text-pink-800 border-pink-200'
};

export default function CampusPage() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/societies.json')
      .then(res => res.json())
      .then(data => {
        setSocieties(data);
        setLoading(false);
      });
  }, []);

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
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
            Campus Life
          </h1>
          <p className="text-gray-600">Explore student societies and campus events</p>
        </div>

        {/* Coming Soon Banner */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Campus Events Coming Soon!</h2>
            <p className="text-gray-600 mb-4">
              We're working on bringing you the latest updates about campus events, 
              workshops, seminars, and activities from all student societies.
            </p>
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              <CompassIcon className="w-4 h-4 mr-1" />
              Feature in Development
            </Badge>
          </CardContent>
        </Card>

        {/* Student Societies */}
        <div>
          <div className="flex items-center mb-6">
            <UsersIcon className="w-6 h-6 mr-2 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Student Societies</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {societies.map((society) => (
              <Card key={society.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {society.name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={categoryColors[society.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800 border-gray-200'}
                      >
                        {society.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {society.description}
                  </p>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(society.website, '_blank')}
                    >
                      <GlobeIcon className="w-4 h-4 mr-2" />
                      Visit Website
                      <ExternalLinkIcon className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Future Features Preview */}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Coming Features</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="p-4 bg-gray-50 rounded-lg">
                <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                <p className="font-medium">Event Calendar</p>
                <p className="text-xs mt-1">Society events & activities</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <UsersIcon className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                <p className="font-medium">Society Updates</p>
                <p className="text-xs mt-1">Latest news & announcements</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <GlobeIcon className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                <p className="font-medium">Event Registration</p>
                <p className="text-xs mt-1">Register for events online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}