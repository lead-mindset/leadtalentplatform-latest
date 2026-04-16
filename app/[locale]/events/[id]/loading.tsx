export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Event detail skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event header skeleton */}
            <div className="space-y-4">
              <div className="bg-muted h-8 w-48 rounded-lg animate-pulse"></div>
              <div className="bg-muted h-4 w-64 rounded animate-pulse"></div>
            </div>
            
            {/* Event image skeleton */}
            <div className="bg-muted h-64 rounded-xl animate-pulse"></div>
            
            {/* Event description skeleton */}
            <div className="space-y-3">
              <div className="bg-muted h-6 w-32 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-muted h-4 w-full rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Event details skeleton */}
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <div className="bg-muted h-6 w-24 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="bg-muted h-4 w-20 rounded animate-pulse"></div>
                    <div className="bg-muted h-4 w-32 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar skeleton */}
          <div className="space-y-6">
            {/* Registration card skeleton */}
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <div className="bg-muted h-6 w-24 rounded animate-pulse"></div>
              <div className="space-y-3">
                <div className="bg-muted h-10 w-full rounded-lg animate-pulse"></div>
                <div className="bg-muted h-4 w-32 rounded animate-pulse"></div>
                <div className="bg-muted h-4 w-28 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Info cards skeleton */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-6 space-y-3">
                <div className="bg-muted h-5 w-20 rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="bg-muted h-4 w-full rounded animate-pulse"></div>
                  <div className="bg-muted h-4 w-3/4 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
