"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
// import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type Batch = {
  batch_name: string;
  is_active: boolean;
  placement_pointers: string[];
};

type RecruiterLogo = {
  src: string;
  alt: string;
};

type OfficialData = {
  _id: string;
  batches: Batch[];
  intro_text: string;
  main_heading: string;
  recruiter_logos: RecruiterLogo[];
  scrape_timestamp: string;
};

export default function OfficialPlacements() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data, isLoading, error } = useQuery<OfficialData>({
    queryKey: ["official-placement"],
    queryFn: async () => {
      const res = await fetch("/api/official-placements", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
  });

  const activeBatch = data?.batches?.find(b => b.is_active);
  const defaultBatchValue = activeBatch?.batch_name || data?.batches?.[0]?.batch_name || "";

  // Helper function to extract main batch name and additional info from parentheses
  const parseBatchName = (batchName: string) => {
    const match = batchName.match(/^(.+?)\s*\((.+)\)$/);
    if (match) {
      return {
        main: match[1].trim(),
        extra: match[2].trim(),
      };
    }
    return {
      main: batchName,
      extra: null,
    };
  };

  return (
    <Card 
      className="border card-theme hover:shadow-lg transition-all duration-300"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
        color: "var(--text-color)",
      }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold" style={{ color: "var(--text-color)" }}>
                  Official Placement Data
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://jiit.ac.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: "var(--accent-color)" }}
                >
                  <span className="hidden sm:inline">Visit Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="p-1">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5" style={{ color: "var(--label-color)" }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: "var(--label-color)" }} />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {isLoading && (
              <div className="text-sm opacity-70 text-center py-4">
                Loading official placement data…
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 text-center py-4">
                Failed to load official data.
              </div>
            )}

            {data && !isLoading && !error && (
              <div className="space-y-4">
                {/* Tabs for different batches */}
                {data.batches && data.batches.length > 0 && (
                  <Tabs defaultValue={defaultBatchValue} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
                      {data.batches.map((batch) => {
                        const { main } = parseBatchName(batch.batch_name);
                        return (
                          <TabsTrigger
                            key={batch.batch_name}
                            value={batch.batch_name}
                            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md px-3 py-2.5 text-sm font-medium transition-all"
                          >
                            {main}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {data.batches.map((batch) => {
                      const { extra } = parseBatchName(batch.batch_name);
                      return (
                        <TabsContent key={batch.batch_name} value={batch.batch_name} className="mt-4">
                          <div className="space-y-3">
                            {/* Badge for extra info */}
                            {extra && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant="secondary"
                                  className="text-xs font-medium px-3 py-1.5 rounded-full shadow-sm"
                                  style={{
                                    backgroundColor: "var(--accent-color)",
                                    color: "white",
                                  }}
                                >
                                  {extra}
                                </Badge>
                                {batch.is_active && (
                                  <Badge 
                                    variant="outline"
                                    className="text-xs font-medium px-3 py-1.5 rounded-full"
                                    style={{
                                      borderColor: "var(--accent-color)",
                                      color: "var(--accent-color)",
                                    }}
                                  >
                                    Active
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            {/* Placement Pointers */}
                            <div 
                            className="rounded-lg p-4 space-y-2"
                            style={{ 
                              backgroundColor: "var(--bg-color)",
                              border: "1px solid var(--border-color)"
                            }}
                          >
                            <h4 
                              className="font-semibold text-sm mb-3"
                              style={{ color: "var(--text-color)" }}
                            >
                              Placement Highlights
                            </h4>
                            <ul className="space-y-2">
                              {batch.placement_pointers.map((pointer, i) => (
                                <li 
                                  key={i} 
                                  className="text-xs sm:text-sm leading-relaxed flex items-start gap-2"
                                >
                                  <span 
                                    className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                    style={{ backgroundColor: "var(--accent-color)" }}
                                  />
                                  <span style={{ color: "var(--text-color)" }}>{pointer}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </TabsContent>
                      );
                    })}
                  </Tabs>
                )}

                {/* Intro Text */}
                {/* {data.intro_text && (
                  <div 
                    className="text-xs sm:text-sm italic pt-3 border-t"
                    style={{ 
                      color: "var(--label-color)",
                      borderColor: "var(--border-color)"
                    }}
                  >
                    {data.intro_text}
                  </div>
                )} */}

                {/* Recruiter Logos */}
                {/* {data.recruiter_logos && data.recruiter_logos.length > 0 && (
                  <div 
                    className="pt-3 border-t"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <h4 
                      className="font-semibold text-sm mb-3"
                      style={{ color: "var(--text-color)" }}
                    >
                      Key Recruiters
                    </h4>
                    <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
                      {data.recruiter_logos.map((logo, i) => (
                        <div
                          key={i}
                          className="relative w-16 h-16 sm:w-20 sm:h-20 grayscale hover:grayscale-0 transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110"
                          title={logo.alt}
                        >
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            fill
                            className="object-contain"
                            sizes="80px"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}

                {/* Timestamp */}
                {data.scrape_timestamp && (
                  <div 
                    className="text-[10px] pt-2 border-t text-right"
                    style={{ 
                      color: "var(--label-color)",
                      borderColor: "var(--border-color)",
                      opacity: 0.7
                    }}
                  >
                    Last updated: {new Date(data.scrape_timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
