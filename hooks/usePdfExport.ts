import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type ExportUnit =
  | { type: 'page-break' }
  | {
      type: 'content';
      node: HTMLDivElement;
      height: number;
      keepWithNext: boolean;
    };

export const createPaginatedExportRoot = (
  sourceNode: HTMLDivElement,
  mountContainer: HTMLDivElement
): HTMLDivElement => {
  const PAGE_SAFETY_BUFFER_PX = 20;

  const exportRoot = document.createElement('div');
  exportRoot.style.width = '210mm';
  exportRoot.style.maxWidth = '210mm';
  exportRoot.style.background = '#ffffff';
  exportRoot.style.margin = '0';
  exportRoot.style.padding = '0';
  mountContainer.replaceChildren(exportRoot);

  const sourceWidthPx = sourceNode.getBoundingClientRect().width || 794;
  const pageHeightPx = Math.round((sourceWidthPx * 297) / 210);
  const sourceStyles = window.getComputedStyle(sourceNode);
  const paddingTop =
    parseFloat(sourceStyles.paddingTop || '20mm') * 3.7795275591;
  const paddingBottom =
    parseFloat(sourceStyles.paddingBottom || '20mm') * 3.7795275591;
  const maxContentHeightPx = Math.max(
    pageHeightPx - paddingTop - paddingBottom - PAGE_SAFETY_BUFFER_PX,
    200
  );

  const createPage = () => {
    const page = sourceNode.cloneNode(false) as HTMLDivElement;
    page.classList.add('pdf-page');
    page.style.width = '210mm';
    page.style.maxWidth = '210mm';
    page.style.minHeight = '297mm';
    page.style.height = `${pageHeightPx}px`;
    page.style.margin = '0';
    page.style.boxShadow = 'none';
    page.style.borderRadius = '0';
    page.style.overflow = 'hidden';
    page.style.breakAfter = 'page';
    page.style.pageBreakAfter = 'always';
    return page;
  };

  const getElementOuterHeight = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const marginTop = parseFloat(styles.marginTop || '0');
    const marginBottom = parseFloat(styles.marginBottom || '0');
    return rect.height + marginTop + marginBottom;
  };

  const exportUnits: ExportUnit[] = [];

  for (const child of Array.from(sourceNode.children) as HTMLDivElement[]) {
    if (child.classList.contains('page-break')) {
      exportUnits.push({ type: 'page-break' });
      continue;
    }

    exportUnits.push({
      type: 'content',
      node: child.cloneNode(true) as HTMLDivElement,
      height: Math.max(getElementOuterHeight(child), 1),
      keepWithNext: child.classList.contains('keep-with-next'),
    });
  }

  let currentPage = createPage();
  let currentApproxHeight = 0;
  exportRoot.appendChild(currentPage);

  for (let unitIndex = 0; unitIndex < exportUnits.length; unitIndex += 1) {
    const unit = exportUnits[unitIndex];
    if (unit.type === 'page-break') {
      if (currentPage.childElementCount === 0) {
        continue;
      }

      currentPage = createPage();
      currentApproxHeight = 0;
      exportRoot.appendChild(currentPage);
      continue;
    }

    const nextUnit = exportUnits[unitIndex + 1];
    const nextHeight =
      nextUnit && nextUnit.type === 'content' ? nextUnit.height : 0;
    const shouldMoveUnitToNextPage =
      unit.keepWithNext &&
      currentApproxHeight > 0 &&
      currentApproxHeight + unit.height + nextHeight > maxContentHeightPx;

    if (shouldMoveUnitToNextPage) {
      currentPage = createPage();
      currentApproxHeight = 0;
      exportRoot.appendChild(currentPage);
    }

    const blockClone = unit.node.cloneNode(true) as HTMLDivElement;
    currentPage.appendChild(blockClone);

    if (currentPage.scrollHeight <= currentPage.clientHeight + 1) {
      currentApproxHeight += unit.height;
      continue;
    }

    currentPage.removeChild(blockClone);

    if (currentPage.childElementCount > 0) {
      currentPage = createPage();
      currentApproxHeight = 0;
      exportRoot.appendChild(currentPage);
      currentPage.appendChild(blockClone);
      currentApproxHeight += unit.height;
    } else if (unit.height > maxContentHeightPx) {
      const firstChildTag =
        blockClone.firstElementChild?.tagName?.toLowerCase();
      const canOverflowSinglePage =
        firstChildTag !== 'p' && firstChildTag !== 'li';

      if (canOverflowSinglePage) {
        currentPage.appendChild(blockClone);
        currentPage.style.height = 'auto';
        currentPage.style.overflow = 'visible';
        currentPage.style.minHeight = '297mm';

        currentPage = createPage();
        currentApproxHeight = 0;
        exportRoot.appendChild(currentPage);
      } else {
        currentPage.appendChild(blockClone);
        currentApproxHeight += unit.height;
      }
    } else {
      currentPage.appendChild(blockClone);
      currentApproxHeight += unit.height;
    }
  }

  if (currentPage.childElementCount === 0) {
    currentPage.remove();
  }

  const pages = Array.from(
    exportRoot.querySelectorAll('.pdf-page')
  ) as HTMLDivElement[];
  const lastPage = pages[pages.length - 1];
  if (lastPage) {
    lastPage.style.breakAfter = 'auto';
    lastPage.style.pageBreakAfter = 'auto';
  }

  const EMPTY_SPACE_THRESHOLD = 150;
  for (let i = 0; i < pages.length - 1; i += 1) {
    const currentPageEl = pages[i];
    const nextPageEl = pages[i + 1];
    const currentHeight = currentPageEl.scrollHeight;
    const pageHeight = currentPageEl.clientHeight;
    const remainingSpace = pageHeight - currentHeight;

    if (
      remainingSpace > EMPTY_SPACE_THRESHOLD &&
      nextPageEl.children.length > 0
    ) {
      const firstChild = nextPageEl.firstElementChild;
      if (firstChild) {
        nextPageEl.removeChild(firstChild);
        currentPageEl.appendChild(firstChild);
        currentApproxHeight += firstChild.scrollHeight;
      }
    }
  }

  return exportRoot;
};

export const exportCanvasSlicesToPdf = async (
  element: HTMLDivElement,
  pdf: jsPDF,
  startWithBlankDocument: boolean
) => {
  const fullCanvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pageHeightPx = Math.floor((fullCanvas.width * 297) / 210);
  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < fullCanvas.height) {
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = fullCanvas.width;
    sliceCanvas.height = pageHeightPx;

    const context = sliceCanvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context unavailable');
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    context.drawImage(
      fullCanvas,
      0,
      offsetY,
      fullCanvas.width,
      Math.min(pageHeightPx, fullCanvas.height - offsetY),
      0,
      0,
      fullCanvas.width,
      Math.min(pageHeightPx, fullCanvas.height - offsetY)
    );

    const imageData = sliceCanvas.toDataURL('image/jpeg', 0.98);

    if (!startWithBlankDocument || pageIndex > 0) {
      pdf.addPage('a4', 'portrait');
    }

    pdf.addImage(imageData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    offsetY += pageHeightPx;
    pageIndex += 1;
  }
};
