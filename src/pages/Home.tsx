import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Star, ChevronRight, Utensils, Truck, Award } from 'lucide-react';
import { reviewAPI, menuAPI } from '../services/api';

export default function Home() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reviewsData, menuData] = await Promise.all([
        reviewAPI.getReviews(),
        menuAPI.getMenu()
      ]);
      setReviews(reviewsData.slice(0, 3));
      // Get first 4 items from burgers category
      const burgers = menuData.find((c: any) => c.name === 'Burgers');
      setFeaturedItems(burgers?.items.slice(0, 4) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <section className="relative bg-[#1B4332] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F4A261' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-[#F4A261] text-[#1B4332] rounded-full text-sm font-semibold mb-6">
                Est. 2020 - Where Friends & Burgers Gather!
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                100% Pure Beef <span className="text-[#F4A261]">Burgers</span>
              </h1>
              <p className="text-xl mb-8 text-gray-200">
                Experience the juiciest, most flavorful burgers in Hinunangan. 
                Made with love, served with passion.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  to="/menu" 
                  className="px-8 py-4 bg-[#F4A261] text-[#1B4332] rounded-lg font-bold text-lg hover:bg-[#E76F51] hover:text-white transition-colors"
                >
                  Order Now
                </Link>
                <a 
                  href="tel:09120431891" 
                  className="px-8 py-4 border-2 border-[#F4A261] text-[#F4A261] rounded-lg font-bold text-lg hover:bg-[#F4A261] hover:text-[#1B4332] transition-colors flex items-center gap-2"
                >
                  <Phone size={20} />
                  Call Us
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-[#F4A261] rounded-full blur-3xl opacity-20 animate-pulse" />
                <img 
                  src="/images/hero-burger.png" 
                  alt="Delicious Burger"
                  className="relative z-10 w-full max-w-lg mx-auto drop-shadow-2xl"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=500&fit=crop';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-[#FAFAFA] hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[#1B4332] rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="text-[#F4A261]" size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1B4332] mb-2">Fresh Ingredients</h3>
              <p className="text-gray-600">100% pure beef patties with fresh vegetables daily</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-[#FAFAFA] hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[#1B4332] rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-[#F4A261]" size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1B4332] mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Hot and fresh burgers delivered to your doorstep</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-[#FAFAFA] hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-[#1B4332] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-[#F4A261]" size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1B4332] mb-2">Loyalty Rewards</h3>
              <p className="text-gray-600">Earn points with every order and get free rewards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="py-16 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#1B4332] mb-4">Featured Burgers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our most popular burgers loved by customers</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={item.image_url || `https://source.unsplash.com/400x300/?burger,food&sig=${item.id}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#1B4332] mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#E76F51]">₱{item.price.toFixed(2)}</span>
                    <Link 
                      to="/menu" 
                      className="text-[#1B4332] hover:text-[#F4A261] font-medium flex items-center gap-1"
                    >
                      Order <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link 
              to="/menu" 
              className="inline-block px-8 py-3 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#2D6A4F] transition-colors"
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 bg-[#1B4332] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-gray-300">Real reviews from real burger lovers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white/10 backdrop-blur rounded-xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={20} 
                      className={i < review.rating ? "fill-[#F4A261] text-[#F4A261]" : "text-gray-400"}
                    />
                  ))}
                </div>
                <p className="text-gray-200 mb-4">"{review.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F4A261] rounded-full flex items-center justify-center">
                    <span className="text-[#1B4332] font-bold">{review.user_name?.[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{review.user_name}</p>
                    <p className="text-sm text-gray-400">Verified Customer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold text-[#1B4332] mb-6">Visit Us</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F4A261] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-[#1B4332]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1B4332] mb-1">Address</h3>
                    <p className="text-gray-600">Catmonan St., Poblacion, Hinunangan, Philippines, 6608</p>
                    <a 
                      href="https://www.google.com/maps/place/Vinyard+Burger+Bar/@10.3971559,125.1983495,17z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E76F51] hover:underline text-sm mt-1 inline-block"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F4A261] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-[#1B4332]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1B4332] mb-1">Contact</h3>
                    <p className="text-gray-600">0912 043 1891</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F4A261] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-[#1B4332]" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1B4332] mb-1">Hours</h3>
                    <p className="text-gray-600">Mon - Sun: 2PM - 10:30PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F4A261] rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="text-[#1B4332]" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1B4332] mb-1">Facebook</h3>
                    <a 
                      href="https://www.facebook.com/profile.php?id=100092581604391"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E76F51] hover:underline"
                    >
                      @vinyardburgerbar
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-200 rounded-xl overflow-hidden h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3925.1234567890123!2d125.1983495!3d10.3971559!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x330703c01800b85b%3A0xe88c656190d7499a!2sVinyard%20Burger%20Bar!5e0!3m2!1sen!2sph!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vinyard Burger Bar Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B4332] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/images/logo.jpg"
                  alt="Vinyard Burger Bar"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-[#F4A261] bg-white"
                />
                <span className="font-bold text-xl">Vinyard Burger Bar</span>
              </div>
              <p className="text-gray-400 text-sm">Where friends & burgers gather! Established 2020.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-[#F4A261]">Home</Link></li>
                <li><Link to="/menu" className="hover:text-[#F4A261]">Menu</Link></li>
                <li><Link to="/login" className="hover:text-[#F4A261]">Login</Link></li>
                <li><Link to="/register" className="hover:text-[#F4A261]">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Catmonan St., Poblacion</li>
                <li>Hinunangan, Philippines, 6608</li>
                <li>0912 043 1891</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow Us</h4>
              <a 
                href="https://www.facebook.com/profile.php?id=100092581604391"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-[#F4A261]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2024 Vinyard Burger Bar. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
