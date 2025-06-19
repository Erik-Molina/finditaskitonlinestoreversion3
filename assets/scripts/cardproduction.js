import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAUzXZfOm7laa_ubkP_mYz5YMhYFfy5zOc",
  authDomain: "dataestorage.firebaseapp.com",
  databaseURL: "https://dataestorage-default-rtdb.firebaseio.com",
  projectId: "dataestorage",
  storageBucket: "dataestorage.firebasestorage.app",
  messagingSenderId: "1062428871648",
  appId: "1:1062428871648:web:338409b616e2cfba29b985",
  measurementId: "G-W47EH5YSFS"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Seleccionar elementos del DOM
const productsContainer = document.getElementById('productsContainer');
const categoriesContainer = document.getElementById('categoriesContainer');
const rubroInputs = document.querySelectorAll('input[name="rubro"]');

// Función para renderizar productos con labels por categoría
function renderProducts(products) {
  console.log('Rendering products:', products.length, 'items');
  productsContainer.innerHTML = ''; // Limpiar contenedor

  if (!products || products.length === 0) {
    productsContainer.innerHTML = '<p>No se encontraron productos.</p>';
    return;
  }

  // Obtener categorías seleccionadas
  const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
    .map(checkbox => checkbox.value);

  // Agrupar productos por categoría
  const groupedProducts = {};
  products.forEach(producto => {
    const category = producto.clase || 'Sin categoría';
    if (!groupedProducts[category]) {
      groupedProducts[category] = [];
    }
    groupedProducts[category].push(producto);
  });

  // Renderizar labels y productos
  Object.keys(groupedProducts).forEach((category, index) => {
    if (selectedCategories.length === 0 || selectedCategories.includes(category)) {
      // Añadir label de categoría
      const label = document.createElement('div');
      label.className = 'category-label-row';
      label.innerHTML = `<span class="category-label">${category}</span>`;
      productsContainer.appendChild(label);

      // Renderizar productos de esta categoría
      groupedProducts[category].forEach(producto => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const briefDetail = producto.detalles.length > 50 ? producto.detalles.substring(0, 50) + '...' : producto.detalles || 'Sin detalles';

        card.innerHTML = `
          <div class="product-badge ${producto.disponible ? 'available' : 'sold-out'}">
            ${producto.disponible ? 'Disponible' : 'Agotado'}
          </div>
          <div class="product-image-container">
            <img src="${producto.imagenes_url[0]}" alt="${producto.nombre}" class="product-img" />
            <div class="overlay"></div>
            <button class="view-button" title="Ver producto" data-images='${JSON.stringify(producto.imagenes_url)}' data-product='${JSON.stringify(producto)}'>
              <span class="material-icons">visibility</span> Ver detalles
            </button>
          </div>
          <div class="product-info">
            <h3 class="product-name">${producto.nombre}</h3>
            <p class="product-price">${producto.precio}</p>
            <p class="product-brief">${briefDetail}</p>
            <p class="product-manufacturer"><strong>Fabricante:</strong> ${producto.fabricante}</p>
          </div>
        `;

        productsContainer.appendChild(card);
      });
    }
  });

  // Añadir event listeners para los botones de "Ver"
  document.querySelectorAll('.view-button').forEach(button => {
    button.addEventListener('click', () => {
      const images = JSON.parse(button.dataset.images);
      const product = JSON.parse(button.dataset.product);
      openProductImagesModal(images, product);
    });
  });
}

// Función para obtener categorías únicas según el rubro
function getCategoriesByRubro(data, rubro) {
  console.log('Getting categories for rubro:', rubro);
  const categories = new Set();
  Object.values(data).forEach(producto => {
    if (producto.rubro === rubro && producto.clase) {
      categories.add(producto.clase);
    }
  });
  const categoryList = Array.from(categories).sort();
  console.log('Categories found:', categoryList);
  return categoryList;
}

// Función para renderizar checkboxes de categorías
function renderCategories(categories) {
  console.log('Rendering categories:', categories);
  categoriesContainer.innerHTML = ''; // Limpiar contenedor de categorías

  if (categories.length === 0) {
    const noCategories = document.createElement('p');
    noCategories.textContent = 'No hay categorías disponibles';
    noCategories.style.color = '#ccc';
    noCategories.style.fontSize = '14px';
    categoriesContainer.appendChild(noCategories);
    return;
  }

  categories.forEach(category => {
    const label = document.createElement('label');
    label.className = 'filter-item';
    label.innerHTML = `
      <input type="checkbox" name="category" value="${category}">
      <span>${category}</span>
    `;
    categoriesContainer.appendChild(label);
  });
}

// Función para filtrar productos según rubro y categorías seleccionadas
function filterProducts(data, rubro, selectedCategories) {
  console.log('Filtering products - Rubro:', rubro, 'Categories:', selectedCategories);
  const products = Object.values(data);
  if (!rubro) {
    return products;
  }
  if (selectedCategories.length === 0) {
    return products.filter(producto => producto.rubro === rubro);
  }
  return products.filter(producto => 
    producto.rubro === rubro && selectedCategories.includes(producto.clase)
  );
}

// Función para abrir el modal de imágenes con carrusel y detalles
function openProductImagesModal(images, product) {
  console.log('Opening images modal with images:', images, 'product:', product);
  let modal = document.getElementById('productImagesModal');
  
  // Crear modal si no existe
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'productImagesModal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  // Generar contenido del modal
  let currentIndex = 0;
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Detalles del Producto</h2>
        <button class="close-modal" id="closeProductImagesModal">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="carousel-container">
          <button class="carousel-prev" id="carouselPrev">
            <span class="material-icons">chevron_left</span>
          </button>
          <div class="carousel-image">
            <img src="${images[currentIndex]}" alt="${product.nombre}" class="modal-product-img" />
          </div>
          <button class="carousel-next" id="carouselNext">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
        <div class="product-details-right">
          <h3 class="product-name">${product.nombre}</h3>
          <p class="product-price">Precio: ${product.precio}</p>
          <div class="product-details">
            <p><strong>ID:</strong> ${product.id}</p>
            <p><strong>Fabricante:</strong> ${product.fabricante}</p>
            <p><strong>Clase:</strong> ${product.clase}</p>
            <p><strong>Detalles:</strong> ${product.detalles}</p>
          </div>
          <div class="product-actions">
            <button class="btn-buy-now">Comprar ahora</button>
            <button class="btn-add-cart">Añadir al carrito</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Mostrar modal
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Funciones para navegar en el carrusel
  const prevButton = document.getElementById('carouselPrev');
  const nextButton = document.getElementById('carouselNext');
  const imageElement = modal.querySelector('.modal-product-img');

  function updateCarousel() {
    imageElement.src = images[currentIndex];
    imageElement.alt = `${product.nombre} - Imagen ${currentIndex + 1}`;
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === images.length - 1;
  }

  prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentIndex < images.length - 1) {
      currentIndex++;
      updateCarousel();
    }
  });

  // Añadir evento para cerrar
  document.getElementById('closeProductImagesModal').addEventListener('click', () => {
    modal.classList.remove('open');
    document.body.style.overflow = 'auto';
  });

  // Cerrar al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
      document.body.style.overflow = 'auto';
    }
  });

  updateCarousel(); // Inicializar carrusel
}

// Lógica principal
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Firebase listener');
  const productosRef = ref(db, '/');

  // Obtener datos de Firebase
  onValue(productosRef, (snapshot) => {
    console.log('Firebase snapshot received');
    const data = snapshot.val() || {};
    console.log('Data received:', data);

    // Cargar todos los productos al inicio
    const allProducts = Object.values(data);
    renderProducts(allProducts);

    // Evento para cambio de rubro
    rubroInputs.forEach(input => {
      input.addEventListener('change', () => {
        const currentRubro = input.value;
        
        // Renderizar categorías del rubro seleccionado
        const categories = getCategoriesByRubro(data, currentRubro);
        renderCategories(categories);
        
        // Limpiar selección de categorías y renderizar productos del rubro
        const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
        categoryCheckboxes.forEach(checkbox => (checkbox.checked = false));
        const products = filterProducts(data, currentRubro, []);
        renderProducts(products);
      });
    });

    // Evento para cambio de categorías (selección múltiple)
    categoriesContainer.addEventListener('change', (event) => {
      if (event.target.name === 'category') {
        const currentRubro = document.querySelector('input[name="rubro"]:checked')?.value;
        console.log('Category changed, current rubro:', currentRubro);
        if (!currentRubro) {
          console.warn('No rubro selected, skipping category filter');
          return;
        }

        const selectedCategories = Array.from(
          document.querySelectorAll('input[name="category"]:checked')
        ).map(checkbox => checkbox.value);

        const filteredProducts = filterProducts(data, currentRubro, selectedCategories);
        renderProducts(filteredProducts);
      }
    });
  }, {
    onlyOnce: false // Escuchar cambios en tiempo real
  });
});