import pytest


@pytest.mark.asyncio
async def test_status_summary(client):
    response = await client.get("/api/status/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_deployments" in data
    assert "successful_deployments" in data
    assert "failed_deployments" in data
    assert "running_deployments" in data
    assert "environments" in data
