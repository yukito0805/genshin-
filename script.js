// マップ初期化
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 3,
  zoom: -1,
  zoomControl: true,
  zoomAnimation: true,
  doubleClickZoom: false
});

// エリア定義
const areas = {
  mondstadt: { url: 'images/mondstadt.png', width: 3878, height: 2765, subAreas: {} },
  liyue: { 
    url: 'images/liyue.png', 
    width: 4169, 
    height: 4571, 
    subAreas: { 
      sougan: { url: 'images/natlan_P0.png', width: 1677, height: 1893 } 
    } 
  },
  inazuma: { 
    url: 'images/inazuma1_P0.png', 
    width: 5568, 
    height: 6018, 
    subAreas: { 
      enkonomiya: { url: 'images/inazuma_P0.png', width: 3018, height: 3171 } 
    } 
  },
  sumeru: { url: 'images/sumeru_P0_highres.png', width: 5578, height: 5543, subAreas: {} },
  fontaine: { 
    url: 'images/fontaine_map.png', 
    width: 4356, 
    height: 3175, 
    subAreas: { 
      ancientSea: { url: 'images/map34_P0.png', width: 1014, height: 1998 } 
    } 
  },
  natlan: { 
    url: 'images/natlan_N1.png', 
    width: 5896, 
    height: 5432, 
    subAreas: { 
      ancientMountain: { url: 'images/map36_P0.png', width: 3117, height: 2634 } 
    } 
  }
};

// 現在のエリアとサブエリア
let currentArea = 'mondstadt';
let currentSubArea = null;
let currentOverlay = null;

// ピンのアイコン定義
const pinIcons = {
  '風神瞳': { url: 'images/hujin.jpg', size: [48, 48], anchor: [24, 24] },
  '岩神瞳': { url: 'images/iwagami.jpg', size: [48, 48], anchor: [24, 24] },
  '雷神瞳': { url: 'images/inazumahitomi.png', size: [48, 48], anchor: [24, 24] },
  '草神瞳': { url: 'images/sousin.png', size: [48, 48], anchor: [24, 24] },
  '水神瞳': { url: 'images/suijin.png', size: [48, 48], anchor: [24, 24] },
  '炎神瞳': { url: 'images/enjin.png', size: [48, 48], anchor: [24, 24] }
};

// ピンデータ
let pins = JSON.parse(localStorage.getItem('pins') || '[]');
let editingIndex = null;

// マップの表示
function loadMap(area, subArea = null) {
  const areaData = subArea ? areas[area].subAreas[subArea] : areas[area];
  console.log('Loading map:', areaData.url); // デバッグ
  const bounds = [[0, 0], [areaData.height, areaData.width]];
  
  if (currentOverlay) map.removeLayer(currentOverlay);
  
  currentOverlay = L.imageOverlay(areaData.url, bounds).addTo(map);
  map.fitBounds(bounds);
  map.setMaxBounds(bounds);
  
  refreshMap();
  updateCounts();
}

// 初期マップ（モンド）
loadMap(currentArea);

// エリア選択
$('#areaSelect').on('change', function () {
  currentArea = $(this).val();
  currentSubArea = null;
  loadMap(currentArea);
  
  const subAreas = areas[currentArea].subAreas;
  $('#subAreaSelect').empty().append('<option value="">サブエリアを選択</option>');
  if (Object.keys(subAreas).length > 0) {
    for (const [key, value] of Object.entries(subAreas)) {
      $('#subAreaSelect').append(`<option value="${key}">${key === 'sougan' ? '層岩巨淵' : key === 'enkonomiya' ? '淵下宮' : key === 'ancientSea' ? '往日の海' : '古の聖山'}</option>`);
    }
    $('#subAreaSelect').show();
  } else {
    $('#subAreaSelect').hide();
  }
});

// サブエリア選択
$('#subAreaSelect').on('change', function () {
  currentSubArea = $(this).val() || null;
  loadMap(currentArea, currentSubArea);
});

// ピンのマップ表示
function addPinToMap(pin, index) {
  if (pin.area !== currentArea || (pin.subArea && pin.subArea !== currentSubArea) || (!pin.subArea && currentSubArea)) return;
  console.log('Adding pin:', pin);
  const icon = pinIcons[pin.icon];
  if (!icon) {
    console.error('Invalid icon:', pin.icon);
    return;
  }
  const marker = L.marker([pin.lat, pin.lng], {
    icon: L.icon({
      iconUrl: icon.url,
      iconSize: icon.size,
      iconAnchor: icon.anchor
    })
  })
    .addTo(map)
    .bindPopup(`
      <strong>${pin.icon}</strong><br>
      ${pin.note ? `<p>${pin.note}</p>` : ''}
      ${pin.image ? `<img src="${pin.image}" style="max-width: 200px;">` : ''}
      ${pin.video ? `<iframe width="200" height="150" src="${pin.video.replace('watch?v=', 'embed/')}"></iframe>` : ''}
      <div class="mt-2">
        <button class="btn btn-sm btn-primary" onclick="editPin(${index})">編集</button>
        <button class="btn btn-sm btn-danger" onclick="deletePin(${index})">削除</button>
      </div>
    `)
    .on('add', () => {
      const img = new Image();
      img.src = icon.url;
      img.onerror = () => console.error(`Failed to load pin icon: ${icon.url}`);
    });
}

// 右クリックでピン追加
map.on('contextmenu', function (e) {
  console.log('Right-click at:', e.latlng);
  window.tempCoords = e.latlng;
  editingIndex = null;
  $('#pinForm')[0].reset();
  $('#pinIcon').val('');
  $('#imagePreview').hide();
  $('#videoPreview').hide();
  $('.icon-option').removeClass('selected');
  try {
    $('#pinModal').modal('show');
  } catch (err) {
    console.error('Modal error:', err);
  }
});

// アイコン選択
$('.icon-option').on('click', function () {
  $('.icon-option').removeClass('selected');
  $(this).addClass('selected');
  $('#pinIcon').val($(this).data('icon'));
});

// ピンの保存
function savePin() {
  const icon = $('#pinIcon').val();
  if (!icon) {
    alert('アイコンを選択してください');
    return;
  }
  const pin = {
    icon: icon,
    note: document.getElementById('pinNote').value,
    image: document.getElementById('pinImage').value,
    video: document.getElementById('pinVideo').value,
    lat: window.tempCoords.lat,
    lng: window.tempCoords.lng,
    area: currentArea,
    subArea: currentSubArea
  };
  console.log('Saving pin:', pin);

  if (editingIndex !== null) {
    pins[editingIndex] = pin;
  } else {
    pins.push(pin);
  }

  localStorage.setItem('pins', JSON.stringify(pins));
  refreshMap();
  $('#pinModal').modal('hide');
  updateCounts();
}

// ピンの編集
function editPin(index) {
  console.log('Editing pin:', pins[index]);
  editingIndex = index;
  const pin = pins[index];
  $('#pinIcon').val(pin.icon);
  $('#pinNote').val(pin.note);
  $('#pinImage').val(pin.image);
  $('#pinVideo').val(pin.video);
  $('.icon-option').removeClass('selected');
  $(`.icon-option[data-icon="${pin.icon}"]`).addClass('selected');
  window.tempCoords = { lat: pin.lat, lng: pin.lng };
  updatePreviews();
  $('#pinModal').modal('show');
}

// ピンの削除
function deletePin(index) {
  console.log('Deleting pin:', index);
  pins.splice(index, 1);
  localStorage.setItem('pins', JSON.stringify(pins));
  refreshMap();
  updateCounts();
}

// マップのリフレッシュ
function refreshMap() {
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });
  pins.forEach((pin, index) => addPinToMap(pin, index));
}

// カウント更新
function updateCounts() {
  const counts = {
    '風神瞳': 0,
    '岩神瞳': 0,
    '雷神瞳': 0,
    '草神瞳': 0,
    '水神瞳': 0,
    '炎神瞳': 0
  };
  pins.forEach(pin => {
    if (pin.area === currentArea && (!pin.subArea && !currentSubArea || pin.subArea === currentSubArea)) {
      if (counts[pin.icon] !== undefined) counts[pin.icon]++;
    }
  });
  document.getElementById('countHujin').textContent = counts['風神瞳'];
  document.getElementById('countIwagami').textContent = counts['岩神瞳'];
  document.getElementById('countRaijin').textContent = counts['雷神瞳'];
  document.getElementById('countSoushin').textContent = counts['草神瞳'];
  document.getElementById('countSuijin').textContent = counts['水神瞳'];
  document.getElementById('countEnshin').textContent = counts['炎神瞳'];
}

// 画像と動画のプレビュー
$('#pinImage').on('input', function () {
  const url = $(this).val();
  $('#imagePreview').attr('src', url).toggle(!!url);
});
$('#pinVideo').on('input', function () {
  const url = $(this).val();
  $('#videoPreview').attr('src', url.replace('watch?v=', 'embed/')).toggle(!!url);
});

// モーダル表示時のプレビュー更新
function updatePreviews() {
  const imageUrl = $('#pinImage').val();
  const videoUrl = $('#pinVideo').val();
  $('#imagePreview').attr('src', imageUrl).toggle(!!imageUrl);
  $('#videoPreview').attr('src', videoUrl.replace('watch?v=', 'embed/')).toggle(!!videoUrl);
}

// 初期ピンの読み込み
pins.forEach((pin, index) => addPinToMap(pin, index));

// 初期カウント
updateCounts();