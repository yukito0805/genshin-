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
  '炎神瞳': { url: 'images/enjin.png', size: [48, 48], anchor: [24, 24] },
  'チャレンジ': { url: 'images/challenge.png', size: [48, 48], anchor: [24, 24] },
  '仙霊': { url: 'images/senrei.png', size: [48, 48], anchor: [24, 24] },
  '元素石碑': { url: 'images/sekihi.png', size: [48, 48], anchor: [24, 24] },
  '立方体': { url: 'images/square.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋1': { url: 'images/key1.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋2': { url: 'images/key2.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋3': { url: 'images/key3.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋4': { url: 'images/key4.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋5': { url: 'images/key5.png', size: [48, 48], anchor: [24, 24] },
  '雷霊': { url: 'images/rairei.png', size: [48, 48], anchor: [24, 24] },
  'アランナラ': { url: 'images/arannara.png', size: [48, 48], anchor: [24, 24] },
  'スメールギミック': { url: 'images/SGimmick.png', size: [48, 48], anchor: [24, 24] },
  'リーフコア': { url: 'images/leaf.png', size: [48, 48], anchor: [24, 24] },
  '短火装置': { url: 'images/dai.png', size: [48, 48], anchor: [24, 24] },
  '死域': { url: 'images/shiki.png', size: [48, 48], anchor: [24, 24] },
  '普通の宝箱': { url: 'images/hutu.png', size: [48, 48], anchor: [24, 24] },
  '精巧な宝箱': { url: 'images/seikou.png', size: [48, 48], anchor: [24, 24] },
  '貴重な宝箱': { url: 'images/kityou.png', size: [48, 48], anchor: [24, 24] },
  '豪華な宝箱': { url: 'images/gouka.png', size: [48, 48], anchor: [24, 24] },
  '珍奇な宝箱': { url: 'images/tinki.png', size: [48, 48], anchor: [24, 24] }
};

// 宝箱の印数
const chestSeals = {
  '普通の宝箱': 1,
  '精巧な宝箱': 2,
  '貴重な宝箱': 3,
  '豪華な宝箱': 4,
  '珍奇な宝箱': 0
};

// ピンデータ
let pins = JSON.parse(localStorage.getItem('pins') || '[]');
let editingIndex = null;

// マップの表示
function loadMap(area, subArea = null) {
  console.log('loadMap called:', { area, subArea });
  const areaData = subArea ? areas[area].subAreas[subArea] : areas[area];
  if (!areaData) {
    console.error('Invalid area or subArea:', { area, subArea });
    return;
  }
  console.log('Loading map:', areaData.url, 'Dimensions:', areaData.width, 'x', areaData.height);
  const bounds = [[0, 0], [areaData.height, areaData.width]];
  
  if (currentOverlay) {
    map.removeLayer(currentOverlay);
    console.log('Removed previous overlay');
  }
  
  currentOverlay = L.imageOverlay(areaData.url, bounds)
    .on('error', () => console.error('Failed to load map image:', areaData.url))
    .on('load', () => console.log('Map image loaded successfully:', areaData.url))
    .addTo(map);
  
  try {
    map.fitBounds(bounds);
    map.setMaxBounds(bounds);
    console.log('Map bounds set:', bounds);
  } catch (err) {
    console.error('Error setting map bounds:', err);
  }
  
  refreshMap();
  updateCounts();
  updateSealCounts();
}

// 初期マップ（モンド）
try {
  loadMap(currentArea);
  console.log('Initial map loaded');
} catch (err) {
  console.error('Error loading initial map:', err);
}

// エリア選択
$('#areaSelect').on('change', function () {
  currentArea = $(this).val();
  currentSubArea = null;
  console.log('Area selected:', currentArea);
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
  console.log('SubArea selected:', currentSubArea);
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

  // ピンのアイコン（背景なし）
  const marker = L.marker([pin.lat, pin.lng], {
    icon: L.icon({
      iconUrl: icon.url,
      iconSize: icon.size,
      iconAnchor: icon.anchor,
      popupAnchor: [0, -icon.anchor[1]]
    })
  })
    .addTo(map)
    .bindPopup(`
      <strong>${pin.icon}${getFlagText(pin)}</strong><br>
      ${pin.note ? `<p>備考: ${pin.note}</p>` : ''}
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

  // バッジの表示（ピンの下）
  let badges = '';
  if (pin.underground) badges += '<span class="pin-badge badge-underground">U</span>';
  if (pin.seelie) badges += '<span class="pin-badge badge-seelie">S</span>';
  if (pin.electroSeelie) badges += '<span class="pin-badge badge-electroSeelie">E</span>';
  if (pin.challenge) badges += '<span class="pin-badge badge-challenge">C</span>';

  if (badges) {
    console.log('Badges:', badges);
    // バッジをピンの下に配置（オフセット5px）
    L.marker([pin.lat, pin.lng], {
      icon: L.divIcon({
        html: `<div style="text-align: center;">${badges}</div>`,
        iconSize: [badges.length * 14, 12], // バッジ数に応じた幅
        iconAnchor: [badges.length * 7, -5], // ピンの下（5px上）
        className: 'badge-container'
      })
    }).addTo(map);
  }
}

// フラグテキストの生成
function getFlagText(pin) {
  const flags = [];
  if (pin.underground) flags.push('地下');
  if (pin.seelie) flags.push('仙霊');
  if (pin.electroSeelie) flags.push('雷霊');
  if (pin.challenge) flags.push('チャレンジ');
  return flags.length ? ` (${flags.join(', ')})` : '';
}

// ピン追加（右クリック＋左クリック）
function openPinModal(e) {
  console.log('Opening modal at:', e.latlng);
  window.tempCoords = e.latlng;
  editingIndex = null;
  $('#pinForm')[0].reset();
  $('#pinIcon').val('');
  $('#underground').prop('checked', false);
  $('#seelie').prop('checked', false);
  $('#electroSeelie').prop('checked', false);
  $('#challenge').prop('checked', false);
  $('#imagePreview').hide();
  $('#videoPreview').hide();
  $('.icon-option').removeClass('selected');
  try {
    $('#pinModal').modal('show');
    console.log('Modal opened successfully');
  } catch (err) {
    console.error('Modal open error:', err);
  }
}

// 右クリック（PC向け）
map.on('contextmenu', openPinModal);

// 左クリック（iPad向け）
map.on('click', openPinModal);

// アイコン選択
$('.icon-option').on('click', function () {
  $('.icon-option').removeClass('selected');
  $(this).addClass('selected');
  $('#pinIcon').val($(this).data('icon'));
  console.log('Icon selected:', $(this).data('icon'));
});

// ピンの保存
function savePin() {
  console.log('savePin called');
  const icon = $('#pinIcon').val();
  if (!icon) {
    console.warn('No icon selected');
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
    subArea: currentSubArea,
    underground: $('#underground').prop('checked'),
    seelie: $('#seelie').prop('checked'),
    electroSeelie: $('#electroSeelie').prop('checked'),
    challenge: $('#challenge').prop('checked')
  };
  console.log('Saving pin:', pin);

  try {
    if (editingIndex !== null) {
      pins[editingIndex] = pin;
    } else {
      pins.push(pin);
    }
    localStorage.setItem('pins', JSON.stringify(pins));
    refreshMap();
    updateCounts();
    updateSealCounts();
    console.log('Pin saved successfully');
  } catch (err) {
    console.error('Error saving pin:', err);
  }

  // モーダルを閉じる
  try {
    $('#pinModal').modal('hide');
    console.log('Modal closed successfully');
    // フォームと状態をリセット
    $('#pinForm')[0].reset();
    $('#pinIcon').val('');
    $('.icon-option').removeClass('selected');
    $('#imagePreview').hide();
    $('#videoPreview').hide();
  } catch (err) {
    console.error('Error closing modal:', err);
  }
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
  $('#underground').prop('checked', pin.underground || false);
  $('#seelie').prop('checked', pin.seelie || false);
  $('#electroSeelie').prop('checked', pin.electroSeelie || false);
  $('#challenge').prop('checked', pin.challenge || false);
  $('.icon-option').removeClass('selected');
  $(`.icon-option[data-icon="${pin.icon}"]`).addClass('selected');
  window.tempCoords = { lat: pin.lat, lng: pin.lng };
  updatePreviews();
  try {
    $('#pinModal').modal('show');
    console.log('Edit modal opened successfully');
  } catch (err) {
    console.error('Edit modal open error:', err);
  }
}

// ピンの削除
function deletePin(index) {
  console.log('Deleting pin:', index);
  try {
    pins.splice(index, 1);
    localStorage.setItem('pins', JSON.stringify(pins));
    refreshMap();
    updateCounts();
    updateSealCounts();
    console.log('Pin deleted successfully');
  } catch (err) {
    console.error('Error deleting pin:', err);
  }
}

// マップのリフレッシュ
function refreshMap() {
  console.log('refreshMap called');
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) map.removeLayer(layer);
  });
  pins.forEach((pin, index) => addPinToMap(pin, index));
  console.log('Map refreshed, pins added:', pins.length);
}

// ピンのカウント更新
function updateCounts() {
  console.log('updateCounts called');
  const counts = {
    '風神瞳': 0,
    '岩神瞳': 0,
    '雷神瞳': 0,
    '草神瞳': 0,
    '水神瞳': 0,
    '炎神瞳': 0,
    'チャレンジ': 0,
    '仙霊': 0,
    '元素石碑': 0,
    '立方体': 0,
    '鍵紋1': 0,
    '鍵紋2': 0,
    '鍵紋3': 0,
    '鍵紋4': 0,
    '鍵紋5': 0,
    '雷霊': 0,
    'アランナラ': 0,
    'スメールギミック': 0,
    'リーフコア': 0,
    '短火装置': 0,
    '死域': 0,
    '普通の宝箱': 0,
    '精巧な宝箱': 0,
    '貴重な宝箱': 0,
    '豪華な宝箱': 0,
    '珍奇な宝箱': 0
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
  document.getElementById('countChallenge').textContent = counts['チャレンジ'];
  document.getElementById('countSenrei').textContent = counts['仙霊'];
  document.getElementById('countSekihi').textContent = counts['元素石碑'];
  document.getElementById('countSquare').textContent = counts['立方体'];
  document.getElementById('countKey1').textContent = counts['鍵紋1'];
  document.getElementById('countKey2').textContent = counts['鍵紋2'];
  document.getElementById('countKey3').textContent = counts['鍵紋3'];
  document.getElementById('countKey4').textContent = counts['鍵紋4'];
  document.getElementById('countKey5').textContent = counts['鍵紋5'];
  document.getElementById('countElectroSeelie').textContent = counts['雷霊'];
  document.getElementById('countArannara').textContent = counts['アランナラ'];
  document.getElementById('countSGimmick').textContent = counts['スメールギミック'];
  document.getElementById('countLeaf').textContent = counts['リーフコア'];
  document.getElementById('countDai').textContent = counts['短火装置'];
  document.getElementById('countShiki').textContent = counts['死域'];
  document.getElementById('countHutu').textContent = counts['普通の宝箱'];
  document.getElementById('countSeikou').textContent = counts['精巧な宝箱'];
  document.getElementById('countKityo').textContent = counts['貴重な宝箱'];
  document.getElementById('countGouka').textContent = counts['豪華な宝箱'];
  document.getElementById('countTinki').textContent = counts['珍奇な宝箱'];
  console.log('Counts updated:', counts);
}

// 印のカウント更新
function updateSealCounts() {
  console.log('updateSealCounts called');
  const seals = {
    mondstadt: 0,
    liyue: 0,
    inazuma: 0,
    sumeru: 0,
    fontaine: 0,
    natlan: 0
  };
  pins.forEach(pin => {
    if (chestSeals[pin.icon] !== undefined) {
      seals[pin.area] += chestSeals[pin.icon];
    }
  });
  document.getElementById('sealMondstadt').textContent = seals['mondstadt'];
  document.getElementById('sealLiyue').textContent = seals['liyue'];
  document.getElementById('sealInazuma').textContent = seals['inazuma'];
  document.getElementById('sealSumeru').textContent = seals['sumeru'];
  document.getElementById('sealFontaine').textContent = seals['fontaine'];
  document.getElementById('sealNatlan').textContent = seals['natlan'];

  // 現在選択中のエリアを強調
  $('.seal-item').removeClass('active');
  $(`#seal${currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}`).parent().addClass('active');
  console.log('Seal counts updated:', seals);
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
updateSealCounts();