import { getModelById, getVideoModelById, getI2IModelById, getI2VModelById, getV2VModelById, getRecastModelById, getLipSyncModelById, getAudioModelById, getMotionControlModelById } from './models.js';
import {
    buildVideoToolPayload,
    serializeVideoToolOptions,
} from './videoToolCapabilities.js';
import { buildImageSizePayload } from './imageSizing.js';
import { buildImageInputPayload, getImageInputValidationError, normalizePrimaryImageUrls } from './imageInputContracts.js';
import { pollForGenerationResult } from './utils/generationLifecycle.js';
import { getModelMediaCapabilities, mapReferenceParams } from './modelCapabilities.js';
import { buildSupplementalInputPayload } from './modelParameters.js';
import { getGroupedVideoConfiguration } from './groupedVideoModels.js';

const BASE_URL = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
    ? '/api'
    : 'https://api.muapi.ai';
const PROXY_WF_BASE = '/api/workflow';
const FILE_UPLOAD_TIMEOUT_MS = 300_000;
const FILE_UPLOAD_PENDING_PROGRESS = 99;

function notifyAuthRequired(status, detail) {
    if (typeof window === 'undefined') return;
    if (status !== 401 && status !== 403) return;
    window.dispatchEvent(new CustomEvent('muapi:auth-required', { detail: { status, message: detail } }));
}

function assertRequiredPrompt(model, params) {
    if (model?.promptRequired && !String(params.prompt || '').trim()) throw new Error('Prompt is required for this model.');
}

function includeRequiredArrayDefaults(model, payload) {
    const defaults = {};
    for (const field of model?.required || []) {
        if (payload[field] !== undefined || model?.inputs?.[field]?.type !== 'array') continue;
        defaults[field] = [];
    }
    return Object.keys(defaults).length > 0 ? { ...defaults, ...payload } : payload;
}

async function pollForResult(requestId, key, maxAttempts = 900, interval = 2000) {
    return pollForGenerationResult({ baseUrl: BASE_URL, requestId, apiKey: key, maxAttempts, interval, onAuthRequired: notifyAuthRequired });
}

function isGeneratedMediaUrl(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false;
    // MuAPI model-card/demo assets are metadata, never generation outputs.
    if (/\/webassets\/videomodels\//i.test(value)) return false;
    return true;
}

function collectGeneratedOutputUrls(result) {
    const candidates = [];
    const add = (value) => {
        if (Array.isArray(value)) return value.forEach(add);
        if (isGeneratedMediaUrl(value)) candidates.push(value);
    };

    // MuAPI's documented prediction contract returns generated media in `outputs`.
    add(result?.outputs);
    // Keep explicit output containers for compatible routes, but never generic result.url.
    add(result?.output?.url);
    add(result?.output?.image);
    add(result?.output?.video);
    add(result?.output?.images);
    add(result?.images);

    return [...new Set(candidates)];
}

function normalizePredictionResult(submitData, result) {
    const requestId = submitData?.request_id || submitData?.id || result?.request_id || result?.id;
    const outputs = collectGeneratedOutputUrls(result);
    if (outputs.length === 0) {
        const error = new Error(`MuAPI completed request ${requestId || 'unknown'} without a generated media output.`);
        error.requestId = requestId;
        error.generationResult = result;
        throw error;
    }
    return {
        ...result,
        ...(requestId ? { request_id: requestId } : {}),
        outputs,
        url: outputs[0],
    };
}

async function submitAndPoll(endpoint, payload, key, onRequestId, maxAttempts = 60) {
    const url = `${BASE_URL}/api/v1/${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const errText = await response.text();
        notifyAuthRequired(response.status, errText);
        throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`);
    }
    const submitData = await response.json();
    const requestId = submitData.request_id || submitData.id;
    if (!requestId) return submitData;
    if (onRequestId) onRequestId(requestId);
    const result = await pollForResult(requestId, key, maxAttempts);
    return normalizePredictionResult(submitData, result);
}

export async function generateImage(apiKey, params) {
    const modelInfo = getModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const payload = { ...buildSupplementalInputPayload(modelInfo, params), prompt: params.prompt };
    if (modelInfo) Object.assign(payload, buildImageSizePayload(modelInfo, params.aspect_ratio));
    else if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (params.image_url) { payload.image_url = params.image_url; payload.strength = params.strength || 0.6; }
    else if (params.images_list) payload.images_list = params.images_list;
    else payload.image_url = null;
    if (params.seed && params.seed !== -1) payload.seed = params.seed;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60);
}

export async function generateI2I(apiKey, params) {
    const modelInfo = getI2IModelById(params.model);
    const endpoint = modelInfo?.endpoint || params.model;
    const imageField = modelInfo?.imageField || 'image_url';
    const imagesList = normalizePrimaryImageUrls(params.images_list, params.image_url);
    const inputError = getImageInputValidationError(modelInfo, 'i2i', { prompt: params.prompt, primaryImageUrls: imagesList, auxiliaryImageUrls: params });
    if (inputError) throw new Error(inputError);
    const payload = {
        ...mapReferenceParams(modelInfo, params),
        ...buildSupplementalInputPayload(modelInfo, params),
        ...buildImageInputPayload(modelInfo, 'i2i', params)
    };
    if (imagesList.length > 0) {
        if (imageField === 'images_list') payload.images_list = imagesList;
        else payload[imageField] = imagesList[0];
    }
    if (modelInfo) Object.assign(payload, buildImageSizePayload(modelInfo, params.aspect_ratio));
    else if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.quality) payload.quality = params.quality;
    if (modelInfo?.inputs?.name) payload.name = params.name || modelInfo.inputs.name.default;
    return submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 60);
}

export async function decomposeLayers(apiKey, params) {
    const endpoint = 'bytedance-seedream-5.0-pro-layer';
    const payload = { image_url: params.image_url, prompt: params.prompt || '', resolution: params.resolution || 'auto', output_format: params.output_format || 'png' };
    const result = await submitAndPoll(endpoint, payload, apiKey, params.onRequestId, 300);
    const rawImages = result.images || result.output?.images || result.outputs || (result.url ? [result.url] : []);
    const images = Array.isArray(rawImages) ? rawImages : [rawImages];
    return { ...result, images };
}
