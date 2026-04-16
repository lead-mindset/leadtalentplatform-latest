export default function EventsLoading() {
  return (
    <div className="min-h-screen">
      {/* Events grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page header skeleton */}
          <div className="space-y-4">
            <div className="bg-muted h-10 w-48 rounded-lg animate-pulse"></div>
            <div className="bg-muted h-6 w-64 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Events grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 space-y-4 animate-pulse">
                {/* Event image skeleton */}
                <div className="bg-muted h-40 rounded-lg w-full"></div>
                
                {/* Event title skeleton */}
                <div className="space-y-2">
                  <div className="bg-muted h-6 w-3/4 rounded"></div>
                  <div className="bg-muted h-4 w-1/2 rounded"></div>
                </div>
                
                {/* Event details skeleton */}
                <div className="space-y-2">
                  <div className="bg-muted h-4 w-full rounded"></div>
                  <div className="bg-muted h-4 w-2/3 rounded"></div>
                </div>
                
                {/* Event CTA skeleton */}
                <div className="bg-muted h-10 w-full rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
