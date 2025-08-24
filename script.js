// --- ユーティリティ: Bootstrapアイコン付きエリア名 ---
const areaNameDisplay = {
  mondstadt: '<i class="bi bi-droplet-half"></i> モンド',
  liyue: '<i class="bi bi-gem"></i> 璃月',
  inazuma: '<i class="bi bi-lightning"></i> 稲妻',
  sumeru: '<i class="bi bi-flower2"></i> スメール',
  fontaine: '<i class="bi bi-water"></i> フォンテーヌ',
  natlan: '<i class="bi bi-fire"></i> ナタ'
};

// --- エリア定義 ---
const areas = {
  mondstadt: { url: 'images/mondstadt.png', width: 3878, height: 2765, subAreas: {} },
  liyue: { 
    url: 'images/liyue.png', 
    width: 4571, 
    height: 4169,
    subAreas: { 
      sougan: { url: 'images/natlan_P0.png', width: 1893, height: 1677 } 
    } 
  },
  inazuma: { 
    url: 'images/inazuma1_P0.png', 
    width: 6018, 
    height: 5568, 
    subAreas: { 
      enkonomiya: { url: 'images/inazuma_P0.png', width: 3171, height: 3018 }
    } 
  },
  sumeru: { url: 'images/sumeru_P0_highres.png', width: 5578, height: 5543, subAreas: {} },
  fontaine: { 
    url: 'images/fontaine_map.png', 
    width: 3175, 
    height: 4356, 
    subAreas: { 
      ancientSea: { url: 'images/fontaineSub.png', width: 2149, height: 2832 },
      erinasu: { url: 'images/erinasu.png', width: 2160, height: 1462 },
      newLayer: { url: 'images/map34_P0.png', width: 1998, height: 1014 }
    } 
  },
  natlan: { 
    url: 'images/natlan_N1.png', 
    width: 5432, 
    height: 5896, 
    subAreas: { 
      ancientMountain: { url: 'images/map36_P0.png', width: 2634, height: 3117 } 
    } 
  }
};

// --- 初期エリア ---
let currentArea = 'mondstadt';
let currentSubArea = null;
let currentOverlay = null;

// --- ピンのアイコン定義 ---
const pinIcons = {
  '風神瞳': { url: 'images/hujin.jpg', size: [32, 32], anchor: [20, 20] },
  '岩神瞳': { url: 'images/iwagami.jpg', size: [32, 32], anchor: [20, 20] },
  '雷神瞳': { url: 'images/inazumahitomi.png', size: [32, 32], anchor: [20, 20] },
  '草神瞳': { url: 'images/sousin.png', size: [32, 32], anchor: [20, 20] },
  '水神瞳': { url: 'images/suijin.png', size: [32, 32], anchor: [20, 20] },
  '炎神瞳': { url: 'images/enjin.png', size: [32, 32], anchor: [20, 20] },
  'チャレンジ': { url: 'images/challenge.png', size: [32, 32], anchor: [20, 20] },
  '仙霊': { url: 'images/senrei.png', size: [32, 32], anchor: [20, 20] },
  'アランナラ': { url: 'images/arannara.png', size: [32, 32], anchor: [20, 20] },
  '幻写霊': { url: 'images/leaf.png', size: [32, 32], anchor: [20, 20] },
  '死域': { url: 'images/shiki.png', size: [32, 32], anchor: [20, 20] },
  '普通の宝箱': { url: 'images/hutu.png', size: [32, 32], anchor: [20, 20] },
  '精巧な宝箱': { url: 'images/seikou.png', size: [32, 32], anchor: [20, 20] },
  '貴重な宝箱': { url: 'images/kityou.png', size: [32, 32], anchor: [20, 20] },
  '豪華な宝箱': { url: 'images/gouka.png', size: [32, 32], anchor: [20, 20] },
  '珍奇な宝箱': { url: 'images/tinki.png', size: [32, 32], anchor: [20, 20] }
};

const chestSeals = {
  '普通の宝箱': 1,
  '精巧な宝箱': 2,
  '貴重な宝箱': 3,
  '豪華な宝箱': 4,
  '珍奇な宝箱': 0
};

let pins = JSON.parse(localStorage.getItem('pins') || '[]').map(pin => ({
  ...pin,
  obtained: pin.obtained !== undefined ? pin.obtained : true,
  downway: pin.downway || false,
  underground: pin.underground || false,
  seelie: pin.seelie || false,
  electroSeelie: pin.electroSeelie || false,
  challenge: pin.challenge || false,
  gimmick: pin.gimmick || false,
  images: pin.images || (pin.image ? [pin.image] : []),
  note: pin.note || '',
  video: pin.video || ''
}));
localStorage.setItem('pins', JSON.stringify(pins));
let editingIndex = null;
let lines = JSON.parse(localStorage.getItem('lines') || '[]');

const visibleIcons = JSON.parse(localStorage.getItem('visibleIcons') || '{}');
Object.keys(pinIcons).forEach(icon => {
  if (visibleIcons[icon] === undefined) visibleIcons[icon] = true;
});
localStorage.setItem('visibleIcons', JSON.stringify(visibleIcons));

// --- マップ初期化 ---
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 3,
  zoom: -1,
  zoomControl: true,
  zoomAnimation: true,
  doubleClickZoom: false
});

// --- エリア選択UI動的生成 ---
function populateAreaSelect() {
  const $areaSelect = $('#areaSelect');
  $areaSelect.empty();
  Object.keys(areas).forEach(area => {
    $areaSelect.append(`<option value="${area}">${areaNameDisplay[area] || area}</option>`);
  });
}
populateAreaSelect();

// --- マップ画像読み込み ---
function loadMap(area, subArea = null) {
  const areaData = subArea ? areas[area].subAreas[subArea] : areas[area];
  if (!areaData) return;
  const bounds = [[0, 0], [areaData.height, areaData.width]];

  map.eachLayer(layer => {
    if (layer instanceof L.ImageOverlay || layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
  });
  currentOverlay = L.imageOverlay(areaData.url, bounds).addTo(map);
  map.fitBounds(bounds);
  map.setMaxBounds(bounds);

  refreshMap();
  updateCounts();
  updateSealCounts();
}

// --- サブエリア選択UIの生成 ---
$('#areaSelect').on('change', function () {
  currentArea = $(this).val();
  currentSubArea = null;
  loadMap(currentArea);

  const subAreas = areas[currentArea].subAreas;
  const $sub = $('#subAreaSelect');
  $sub.empty().append('<option value="">サブエリアを選択</option>');
  if (Object.keys(subAreas).length > 0) {
    for (const [key, value] of Object.entries(subAreas)) {
      let displayName = key;
      switch (key) {
        case 'sougan':        displayName = '層岩巨淵'; break;
        case 'enkonomiya':    displayName = '淵下宮'; break;
        case 'ancientSea':    displayName = '水中'; break;
        case 'erinasu':       displayName = 'エリナス'; break;
        case 'newLayer':      displayName = '往日の海'; break;
        case 'ancientMountain': displayName = '古の聖山'; break;
      }
      $sub.append(`<option value="${key}">${displayName}</option>`);
    }
    $sub.show();
  } else {
    $sub.hide();
  }
});
$('#subAreaSelect').on('change', function () {
  currentSubArea = $(this).val() || null;
  loadMap(currentArea, currentSubArea);
});

// --- 表示/非表示コントロール ---
function initVisibilityControls() {
  const container = document.getElementById('iconVisibilityControls');
  container.innerHTML = '';
  Object.keys(pinIcons).forEach(icon => {
    const div = document.createElement('div');
    div.className = 'form-check';
    div.innerHTML = `
      <input class="form-check-input" type="checkbox" id="visibility-${icon}" ${visibleIcons[icon] ? 'checked' : ''}>
      <label class="form-check-label" for="visibility-${icon}">${icon}</label>
    `;
    container.appendChild(div);
    document.getElementById(`visibility-${icon}`).addEventListener('change', function () {
      visibleIcons[icon] = this.checked;
      localStorage.setItem('visibleIcons', JSON.stringify(visibleIcons));
      refreshMap();
    });
  });
}
initVisibilityControls();

// --- ピン追加モーダル起動 ---
function openPinModal(e) {
  window.tempCoords = e.latlng;
  editingIndex = null;
  $('#pinForm')[0].reset();
  $('#pinIcon').val('');
  $('.icon-option').removeClass('selected');
  $('#imagePreview1, #imagePreview2, #imagePreview3, #videoPreview').hide();
  $('#pinModal').modal('show');
}
map.on('contextmenu', openPinModal);
map.on('click', openPinModal);

// --- アイコン選択 ---
$('.icon-option').on('click', function () {
  $('.icon-option').removeClass('selected');
  $(this).addClass('selected');
  $('#pinIcon').val($(this).data('icon'));
});

// --- ピン保存 ---
function savePin() {
  const icon = $('#pinIcon').val();
  if (!icon) { alert('アイコンを選択してください。'); return; }
  const images = [
    $('#pinImage1').val(),
    $('#pinImage2').val(),
    $('#pinImage3').val()
  ].filter(url => url);
  const pin = {
    icon: icon,
    note: $('#pinNote').val() || '',
    images: images,
    video: $('#pinVideo').val() || '',
    lat: window.tempCoords.lat,
    lng: window.tempCoords.lng,
    area: currentArea,
    subArea: currentSubArea,
    downway: $('#downway').prop('checked'),
    underground: $('#underground').prop('checked'),
    seelie: $('#seelie').prop('checked'),
    electroSeelie: $('#electroSeelie').prop('checked'),
    challenge: $('#challenge').prop('checked'),
    gimmick: $('#gimmick').prop('checked'),
    obtained: $('#obtained').prop('checked')
  };
  if (editingIndex !== null) pins[editingIndex] = pin;
  else pins.push(pin);
  localStorage.setItem('pins', JSON.stringify(pins));
  refreshMap();
  updateCounts();
  updateSealCounts();
  $('#pinModal').modal('hide');
  $('#pinForm')[0].reset();
  $('#pinIcon').val('');
  $('.icon-option').removeClass('selected');
  $('#imagePreview1, #imagePreview2, #imagePreview3, #videoPreview').hide();
}

// --- ピン編集 ---
function editPin(index) {
  editingIndex = index;
  const pin = pins[index];
  $('#pinIcon').val(pin.icon);
  $('#pinNote').val(pin.note);
  $('#pinImage1').val(pin.images && pin.images[0] ? pin.images[0] : '');
  $('#pinImage2').val(pin.images && pin.images[1] ? pin.images[1] : '');
  $('#pinImage3').val(pin.images && pin.images[2] ? pin.images[2] : '');
  $('#pinVideo').val(pin.video);
  $('#downway').prop('checked', pin.downway || false);
  $('#underground').prop('checked', pin.underground || false);
  $('#seelie').prop('checked', pin.seelie || false);
  $('#electroSeelie').prop('checked', pin.electroSeelie || false);
  $('#challenge').prop('checked', pin.challenge || false);
  $('#gimmick').prop('checked', pin.gimmick || false);
  $('#obtained').prop('checked', pin.obtained || false);
  $('.icon-option').removeClass('selected');
  $(`.icon-option[data-icon="${pin.icon}"]`).addClass('selected');
  window.tempCoords = { lat: pin.lat, lng: pin.lng };
  updatePreviews();
  $('#pinModal').modal('show');
}

// --- ピン削除 ---
function deletePin(index) {
  pins.splice(index, 1);
  lines = lines.filter(line => line.from !== index && line.to !== index)
    .map(line => ({
      ...line,
      from: line.from > index ? line.from - 1 : line.from,
      to: line.to > index ? line.to - 1 : line.to
    }));
  localStorage.setItem('pins', JSON.stringify(pins));
  localStorage.setItem('lines', JSON.stringify(lines));
  refreshMap();
  updateCounts();
  updateSealCounts();
}

// --- ピン表示 ---
function addPinToMap(pin, index) {
  if (
    pin.area !== currentArea ||
    (pin.subArea && pin.subArea !== currentSubArea) ||
    (!pin.subArea && currentSubArea) ||
    !visibleIcons[pin.icon]
  ) return;
  const icon = pinIcons[pin.icon];
  if (!icon) return;

  // マーカー
  const marker = L.marker([pin.lat, pin.lng], {
    icon: L.icon({
      iconUrl: icon.url,
      iconSize: icon.size,
      iconAnchor: icon.anchor,
      popupAnchor: [0, -icon.anchor[1]],
      className: pin.obtained ? '' : 'grayscale'
    })
  })
    .addTo(map)
    .bindPopup(`
      <strong>${pin.icon}${getFlagText(pin)}</strong><br>
      <p>取得済み: ${pin.obtained ? 'はい' : 'いいえ'}</p>
      ${pin.note ? `<p>備考: ${pin.note}</p>` : ''}
      ${pin.images && pin.images.length ? pin.images.map(url => `<img src="${url}" class="popup-image" onclick="openImageInNewWindow('${url}')" alt="ピンの画像">`).join('') : ''}
      ${pin.video ? `<iframe width="200" height="150" src="${pin.video.replace('watch?v=', 'embed/')}"></iframe>` : ''}
      <div class="mt-2 d-flex align-items-center gap-2 flex-wrap">
        <button class="btn btn-sm btn-primary" onclick="editPin(${index})"><i class="bi bi-pencil"></i> 編集</button>
        <button class="btn btn-sm btn-danger" onclick="deletePin(${index})"><i class="bi bi-trash"></i> 削除</button>
      </div>
      <div class="form-check form-check-inline mt-2">
        <input class="form-check-input obtained-checkbox" type="checkbox" id="obtained-${index}" ${pin.obtained ? 'checked' : ''} onchange="toggleObtained(${index})">
        <label class="form-check-label" for="obtained-${index}">取得済み</label>
      </div>
    `);

  // バッジ
  let badges = '';
  if (pin.downway) badges += '<span class="pin-badge badge-downway">D</span>';
  if (pin.underground) badges += '<span class="pin-badge badge-underground">U</span>';
  if (pin.seelie) badges += '<span class="pin-badge badge-seelie">S</span>';
  if (pin.electroSeelie) badges += '<span class="pin-badge badge-electroSeelie">E</span>';
  if (pin.challenge) badges += '<span class="pin-badge badge-challenge">C</span>';
  if (pin.gimmick) badges += '<span class="pin-badge badge-gimmick">G</span>';
  if (badges) {
    L.marker([pin.lat, pin.lng], {
      icon: L.divIcon({
        html: `<div style="text-align: center;">${badges}</div>`,
        iconSize: [badges.length * 14, 12],
        iconAnchor: [badges.length * 7, -5],
        className: 'badge-container'
      })
    }).addTo(map);
  }
}

// --- フラグテキスト ---
function getFlagText(pin) {
  const flags = [];
  if (pin.downway) flags.push('下道');
  if (pin.underground) flags.push('地下');
  if (pin.seelie) flags.push('仙霊');
  if (pin.electroSeelie) flags.push('雷霊');
  if (pin.challenge) flags.push('チャレンジ');
  if (pin.gimmick) flags.push('ギミック');
  return flags.length ? ` (${flags.join(', ')})` : '';
}

// --- ピンの取得済み切り替え ---
function toggleObtained(index) {
  pins[index].obtained = !pins[index].obtained;
  localStorage.setItem('pins', JSON.stringify(pins));
  refreshMap();
  updateCounts();
  updateSealCounts();
}

// --- マップリフレッシュ ---
function refreshMap() {
  map.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
  });
  pins.forEach((pin, index) => addPinToMap(pin, index));
  // 線（未実装部分は省略）
}

// --- カウント/印数更新 ---
function updateCounts() {
  const counts = {
    '風神瞳': 0, '岩神瞳': 0, '雷神瞳': 0, '草神瞳': 0, '水神瞳': 0, '炎神瞳': 0,
    'チャレンジ': 0, '仙霊': 0, 'アランナラ': 0, '幻写霊': 0, '死域': 0,
    '普通の宝箱': 0, '精巧な宝箱': 0, '貴重な宝箱': 0, '豪華な宝箱': 0, '珍奇な宝箱': 0
  };
  pins.forEach(pin => {
    if (
      pin.area === currentArea &&
      (!pin.subArea && !currentSubArea || pin.subArea === currentSubArea) &&
      pin.obtained === true
    ) {
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
  document.getElementById('countArannara').textContent = counts['アランナラ'];
  document.getElementById('countGensharei').textContent = counts['幻写霊'];
  document.getElementById('countShiki').textContent = counts['死域'];
  document.getElementById('countHutu').textContent = counts['普通の宝箱'];
  document.getElementById('countSeikou').textContent = counts['精巧な宝箱'];
  document.getElementById('countKityo').textContent = counts['貴重な宝箱'];
  document.getElementById('countGouka').textContent = counts['豪華な宝箱'];
  document.getElementById('countTinki').textContent = counts['珍奇な宝箱'];
}
function updateSealCounts() {
  const seals = {
    mondstadt: 0, liyue: 0, inazuma: 0, sumeru: 0, fontaine: 0, natlan: 0
  };
  pins.forEach(pin => {
    if (chestSeals[pin.icon] !== undefined && pin.obtained === true) {
      seals[pin.area] += chestSeals[pin.icon];
    }
  });
  document.getElementById('sealMondstadt').textContent = seals['mondstadt'];
  document.getElementById('sealLiyue').textContent = seals['liyue'];
  document.getElementById('sealInazuma').textContent = seals['inazuma'];
  document.getElementById('sealSumeru').textContent = seals['sumeru'];
  document.getElementById('sealFontaine').textContent = seals['fontaine'];
  document.getElementById('sealNatlan').textContent = seals['natlan'];
  $('.seal-item').removeClass('active');
  $(`#seal${currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}`).parent().addClass('active');
}

// --- 画像/動画プレビュー ---
$('#pinImage1').on('input', function () {
  const url = $(this).val();
  $('#imagePreview1').attr('src', url).toggle(!!url);
});
$('#pinImage2').on('input', function () {
  const url = $(this).val();
  $('#imagePreview2').attr('src', url).toggle(!!url);
});
$('#pinImage3').on('input', function () {
  const url = $(this).val();
  $('#imagePreview3').attr('src', url).toggle(!!url);
});
$('#pinVideo').on('input', function () {
  const url = $(this).val();
  $('#videoPreview').attr('src', url.replace('watch?v=', 'embed/')).toggle(!!url);
});
function updatePreviews() {
  const imageUrl1 = $('#pinImage1').val();
  const imageUrl2 = $('#pinImage2').val();
  const imageUrl3 = $('#pinImage3').val();
  const videoUrl = $('#pinVideo').val();
  $('#imagePreview1').attr('src', imageUrl1).toggle(!!imageUrl1);
  $('#imagePreview2').attr('src', imageUrl2).toggle(!!imageUrl2);
  $('#imagePreview3').attr('src', imageUrl3).toggle(!!imageUrl3);
  $('#videoPreview').attr('src', videoUrl.replace('watch?v=', 'embed/')).toggle(!!videoUrl);
}

// --- 画像を別ウィンドウで拡大 ---
function openImageInNewWindow(url) {
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>画像拡大表示</title>
      <style>
        body {margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#333;}
        img {max-width:90vw;max-height:90vh;object-fit:contain;}
      </style>
    </head>
    <body>
      <img src="${url}" alt="拡大画像">
    </body>
    </html>
  `);
  win.document.close();
}

// --- ピンのエクスポート ---
$('#exportPins').on('click', function () {
  const data = { pins, lines, visibleIcons };
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pins.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

// --- ピンのインポート ---
$('#importTrigger').on('click', function () {
  const fileInput = document.getElementById('importPins');
  if (!fileInput.files.length) {
    alert('インポートするJSONファイルを選択してください。');
    return;
  }
  const file = fileInput.files[0];
  if (!file.name.endsWith('.json')) {
    alert('JSONファイルを選択してください。');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.pins)) {
        alert('インポートファイルのピンデータが無効です。');
        return;
      }
      pins = data.pins.filter(pin => pin.icon && pin.lat && pin.lng && pin.area).map(pin => ({
        icon: pin.icon,
        lat: pin.lat,
        lng: pin.lng,
        area: pin.area,
        subArea: pin.subArea || null,
        obtained: pin.obtained !== undefined ? pin.obtained : true,
        downway: pin.downway || false,
        underground: pin.underground || false,
        seelie: pin.seelie || false,
        electroSeelie: pin.electroSeelie || false,
        challenge: pin.challenge || false,
        gimmick: pin.gimmick || false,
        images: pin.images || (pin.image ? [pin.image] : []),
        note: pin.note || '',
        video: pin.video || ''
      }));
      lines = Array.isArray(data.lines) ? data.lines.filter(line => Number.isInteger(line.from) && Number.isInteger(line.to) && pins[line.from] && pins[line.to]) : [];
      const newVisibleIcons = data.visibleIcons || {};
      Object.keys(pinIcons).forEach(icon => {
        visibleIcons[icon] = newVisibleIcons[icon] !== undefined ? newVisibleIcons[icon] : true;
      });
      localStorage.setItem('pins', JSON.stringify(pins));
      localStorage.setItem('lines', JSON.stringify(lines));
      localStorage.setItem('visibleIcons', JSON.stringify(visibleIcons));
      initVisibilityControls();
      refreshMap();
      updateCounts();
      updateSealCounts();
      fileInput.value = '';
      alert('データのインポートが完了しました。');
    } catch (err) {
      alert('データのインポート中にエラーが発生しました：' + err.message);
    }
  };
  reader.onerror = function () {
    alert('ファイルの読み込みに失敗しました。');
  };
  reader.readAsText(file);
});

// --- 初期読み込み ---
$(function () {
  loadMap(currentArea);
  refreshMap();
  updateCounts();
  updateSealCounts();
});